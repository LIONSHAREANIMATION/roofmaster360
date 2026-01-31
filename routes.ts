import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { createHash, randomBytes, pbkdf2Sync } from "crypto";
import jwt from "jsonwebtoken";
import OpenAI from "openai";

// Using GPT-5.2 as requested by user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const JWT_SECRET = process.env.SESSION_SECRET!;
if (!process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET environment variable is required for JWT authentication");
  process.exit(1);
}
const JWT_EXPIRY = "7d";

interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  
  req.userId = decoded.userId;
  next();
}

const SALT_LENGTH = 32;
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const verifyHash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return hash === verifyHash;
}

interface RoofSegment {
  pitchDegrees: number;
  azimuthDegrees: number;
  areaMeters2: number;
  planeHeightAtCenterMeters?: number;
}

interface BuildingInsights {
  name?: string;
  center: {
    latitude: number;
    longitude: number;
  };
  boundingBox?: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  imageryDate?: {
    year: number;
    month: number;
    day: number;
  };
  imageryQuality?: string;
  solarPotential?: {
    maxArrayPanelsCount?: number;
    maxArrayAreaMeters2?: number;
    maxSunshineHoursPerYear?: number;
    buildingStats?: {
      areaMeters2: number;
      sunshineQuantiles?: number[];
    };
    roofSegmentStats?: RoofSegment[];
  };
}

interface PermitData {
  id: string;
  address: string;
  permitType: string;
  status: "approved" | "pending" | "expired";
  issueDate: string;
  expiryDate?: string;
  contractor?: {
    name: string;
    phone?: string;
    email?: string;
  };
  value?: number;
  description?: string;
}

async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

async function getRoofMeasurements(lat: number, lng: number, apiKey: string): Promise<BuildingInsights | null> {
  try {
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Solar API error:", errorData);
      return null;
    }
    
    const data = await response.json();
    return data as BuildingInsights;
  } catch (error) {
    console.error("Solar API error:", error);
    return null;
  }
}

async function getPermitHistory(address: string, apiKey: string): Promise<PermitData[]> {
  try {
    const today = new Date();
    const fiveYearsAgo = new Date(today);
    fiveYearsAgo.setFullYear(today.getFullYear() - 5);
    
    const permitFrom = fiveYearsAgo.toISOString().split('T')[0];
    const permitTo = today.toISOString().split('T')[0];
    
    const zipMatch = address.match(/\b(\d{5})\b/);
    const stateMatch = address.match(/\b([A-Z]{2})\b/);
    
    let geoId = "US";
    if (zipMatch) {
      geoId = zipMatch[1];
    } else if (stateMatch) {
      geoId = stateMatch[1];
    }
    
    const params = new URLSearchParams({
      geo_id: geoId,
      permit_from: permitFrom,
      permit_to: permitTo,
      page: "1",
      size: "50"
    });
    
    const url = `https://api.shovels.ai/v2/permits/search?${params.toString()}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shovels API error:", response.status, errorText);
      return [];
    }
    
    const data = await response.json();
    
    const items = data.items || data.data || data.results || [];
    
    if (Array.isArray(items)) {
      const roofingKeywords = ["roof", "shingle", "reroof", "re-roof", "roofing", "solar", "gutter"];
      
      const roofingPermits = items.filter((permit: any) => {
        const workType = (permit.work_type || permit.type || "").toLowerCase();
        const description = (permit.description || permit.work_description || "").toLowerCase();
        const permitType = (permit.permit_type || "").toLowerCase();
        
        return roofingKeywords.some(keyword => 
          workType.includes(keyword) || description.includes(keyword) || permitType.includes(keyword)
        );
      });
      
      const permitsToShow = roofingPermits.length > 0 ? roofingPermits : items.slice(0, 5);
      
      return permitsToShow.slice(0, 10).map((permit: any, index: number) => {
        // Format address - handle both string and object formats
        let formattedAddress = address;
        if (typeof permit.address === 'object' && permit.address) {
          const a = permit.address;
          const parts = [
            a.street_no && a.street ? `${a.street_no} ${a.street}` : a.street,
            a.city,
            a.state
          ].filter(Boolean);
          formattedAddress = parts.join(', ') || address;
        } else if (typeof permit.address === 'string') {
          formattedAddress = permit.address;
        } else if (permit.full_address) {
          formattedAddress = permit.full_address;
        }
        
        return {
          id: permit.id || permit.permit_number || String(index),
          address: formattedAddress,
          permitType: permit.work_type || permit.type || permit.description || "Roofing",
          status: mapPermitStatus(permit.status),
          issueDate: permit.issue_date || permit.filed_date || permit.permit_date || new Date().toISOString(),
          expiryDate: permit.expiry_date || permit.final_date,
          contractor: (permit.contractor_name || permit.contractor?.name) ? {
            name: permit.contractor_name || permit.contractor?.name,
            phone: permit.contractor_phone || permit.contractor?.phone,
            email: permit.contractor_email || permit.contractor?.email
          } : undefined,
          value: permit.value || permit.job_value || permit.valuation,
          description: permit.description || permit.work_description
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error("Shovels API error:", error);
    return [];
  }
}

function mapPermitStatus(status: string): "approved" | "pending" | "expired" {
  if (!status) return "pending";
  const s = status.toLowerCase();
  if (s.includes("issued") || s.includes("approved") || s.includes("final") || s.includes("complete")) {
    return "approved";
  }
  if (s.includes("expired") || s.includes("closed") || s.includes("cancelled")) {
    return "expired";
  }
  return "pending";
}

function metersToFeet(meters: number): number {
  return meters * 10.7639;
}

function calculateRoofSquares(areaMeters2: number): number {
  const sqFeet = metersToFeet(areaMeters2);
  return Math.ceil(sqFeet / 100);
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/roof-measurements", async (req: Request, res: Response) => {
    const { address } = req.body;
    
    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "Address is required" });
    }
    
    const googleApiKey = process.env.GOOGLE_SOLAR_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    
    if (!googleApiKey) {
      return res.status(500).json({ 
        error: "Google API key not configured. Please add GOOGLE_SOLAR_API_KEY.",
        configured: false 
      });
    }
    
    const coordinates = await geocodeAddress(address, googleApiKey);
    
    if (!coordinates) {
      return res.status(404).json({ 
        error: "Could not find address",
        address 
      });
    }
    
    const buildingData = await getRoofMeasurements(coordinates.lat, coordinates.lng, googleApiKey);
    
    if (!buildingData) {
      return res.status(404).json({ 
        error: "Could not get roof measurements for this location",
        coordinates 
      });
    }
    
    const buildingStats = buildingData.solarPotential?.buildingStats;
    const roofSegments = buildingData.solarPotential?.roofSegmentStats || [];
    
    const totalAreaMeters = buildingStats?.areaMeters2 || 
      roofSegments.reduce((sum, seg) => sum + seg.areaMeters2, 0);
    
    const totalAreaSqFt = Math.round(metersToFeet(totalAreaMeters));
    const roofSquares = calculateRoofSquares(totalAreaMeters);
    
    const avgPitch = roofSegments.length > 0
      ? Math.round(roofSegments.reduce((sum, seg) => sum + seg.pitchDegrees, 0) / roofSegments.length)
      : 0;
    
    const pitchRatio = Math.round(Math.tan(avgPitch * Math.PI / 180) * 12);
    
    const segments = roofSegments.map((seg, index) => ({
      id: index + 1,
      areaSqFt: Math.round(metersToFeet(seg.areaMeters2)),
      pitchDegrees: Math.round(seg.pitchDegrees),
      pitchRatio: Math.round(Math.tan(seg.pitchDegrees * Math.PI / 180) * 12),
      orientation: getOrientation(seg.azimuthDegrees),
      azimuthDegrees: Math.round(seg.azimuthDegrees)
    }));
    
    res.json({
      success: true,
      address,
      coordinates,
      measurements: {
        totalAreaSqFt,
        roofSquares,
        avgPitchDegrees: avgPitch,
        avgPitchRatio: pitchRatio,
        segmentCount: segments.length,
        segments
      },
      imageryDate: buildingData.imageryDate,
      imageryQuality: buildingData.imageryQuality
    });
  });

  app.post("/api/permits", async (req: Request, res: Response) => {
    const { address } = req.body;
    
    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "Address is required" });
    }
    
    const shovelsApiKey = process.env.SHOVELS_API_KEY;
    
    if (!shovelsApiKey) {
      return res.status(200).json({ 
        success: true,
        permits: [],
        message: "Permit API not configured - showing no results",
        configured: false 
      });
    }
    
    try {
      const permits = await getPermitHistory(address, shovelsApiKey);
      
      res.json({
        success: true,
        address,
        permits,
        count: permits.length,
        configured: true
      });
    } catch (error) {
      console.error("Permit search error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search permits. Please try again.",
        permits: [],
        configured: true
      });
    }
  });

  app.get("/api/config/status", (_req: Request, res: Response) => {
    res.json({
      googleMapsConfigured: !!(process.env.GOOGLE_SOLAR_API_KEY || process.env.GOOGLE_MAPS_API_KEY),
      googleSolarConfigured: !!(process.env.GOOGLE_SOLAR_API_KEY || process.env.GOOGLE_MAPS_API_KEY),
      shovelsConfigured: !!process.env.SHOVELS_API_KEY,
      openaiConfigured: !!process.env.OPENAI_API_KEY
    });
  });

  app.post("/api/speech-to-text", async (req: Request, res: Response) => {
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      return res.status(500).json({ 
        error: "OpenAI API key not configured",
        configured: false 
      });
    }

    const { audio } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: "Audio data is required" });
    }

    try {
      const audioBuffer = Buffer.from(audio, "base64");
      
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
      formData.append("file", audioBlob, "audio.wav");
      formData.append("model", "whisper-1");
      formData.append("language", "en");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI Whisper error:", errorData);
        return res.status(500).json({ 
          error: "Failed to transcribe audio",
          details: errorData 
        });
      }

      const result = await response.json();
      
      res.json({
        success: true,
        text: result.text,
        configured: true
      });
    } catch (error) {
      console.error("Speech-to-text error:", error);
      res.status(500).json({ 
        error: "Failed to process audio",
        configured: true 
      });
    }
  });

  app.post("/api/ai-assistant", async (req: AuthRequest, res: Response) => {
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      return res.status(500).json({ 
        error: "OpenAI API key not configured",
        configured: false 
      });
    }

    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Check authentication from Authorization header
    const authHeader = req.headers.authorization;
    let userId: string | undefined;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        // Invalid token, continue as guest
      }
    }

    // Check if user can make this request
    if (!userId) {
      return res.status(401).json({ 
        error: "Login required to use AI assistant",
        requiresAuth: true 
      });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ 
        error: "User not found",
        requiresAuth: true 
      });
    }

    const FREE_AI_REQUESTS = 1;
    const aiRequestsUsed = user.aiRequestsUsed || 0;
    const hasSubscription = user.subscriptionStatus === "active" || user.subscriptionStatus === "pro";
    
    if (!hasSubscription && aiRequestsUsed >= FREE_AI_REQUESTS) {
      return res.status(403).json({ 
        error: "Free AI request used. Subscribe for unlimited access.",
        requiresSubscription: true,
        freeRequestsUsed: aiRequestsUsed,
        freeRequestsLimit: FREE_AI_REQUESTS
      });
    }

    try {
      const systemPrompt = `You are RoofMaster 360's AI assistant, an expert in roofing estimation and construction. You help roofing professionals with:
- Address lookups and property information
- Roof measurement guidance and takeoffs
- Material recommendations (shingles, underlayment, flashing, etc.)
- Cost estimation tips
- Permit requirements
- Best practices for roofing projects

Keep responses concise and practical. If the user provides an address, help format it properly for the system. When discussing measurements, use industry-standard terms like "roofing squares" (100 sq ft = 1 square).

${context ? `Current context: ${context}` : ''}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI error:", errorData);
        return res.status(500).json({ 
          error: "Failed to get AI response",
          details: errorData 
        });
      }

      const result = await response.json();
      const aiResponse = result.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
      
      // Increment AI requests used for non-subscribers
      if (!hasSubscription) {
        await storage.incrementAiRequests(userId);
      }
      
      res.json({
        success: true,
        response: aiResponse,
        configured: true,
        freeRequestsRemaining: hasSubscription ? null : Math.max(0, FREE_AI_REQUESTS - aiRequestsUsed - 1)
      });
    } catch (error) {
      console.error("AI assistant error:", error);
      res.status(500).json({ 
        error: "Failed to process request",
        configured: true 
      });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    try {
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const hashedPassword = hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      const token = generateToken(user.id);
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!verifyPassword(password, user.password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Company Branding routes
  app.get("/api/branding", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        success: true,
        branding: {
          companyName: user.companyName || "",
          companyLogo: user.companyLogo || null,
        },
      });
    } catch (error) {
      console.error("Get branding error:", error);
      res.status(500).json({ error: "Failed to get branding" });
    }
  });

  app.put("/api/branding", authMiddleware, async (req: AuthRequest, res: Response) => {
    const { companyName, companyLogo } = req.body;
    
    // Validate company name length
    if (companyName && typeof companyName === "string" && companyName.length > 100) {
      return res.status(400).json({ error: "Company name must be 100 characters or less" });
    }
    
    // Validate logo - must be valid URI and under 2MB (base64 ~1.37x original size)
    if (companyLogo) {
      if (typeof companyLogo !== "string") {
        return res.status(400).json({ error: "Invalid logo format" });
      }
      // Limit logo size to ~2MB encoded
      if (companyLogo.length > 2 * 1024 * 1024 * 1.4) {
        return res.status(400).json({ error: "Logo file is too large (max 2MB)" });
      }
      // Validate URI format
      const isValidUri = companyLogo.startsWith("data:image/") || 
                         companyLogo.startsWith("https://") || 
                         companyLogo.startsWith("file://");
      if (!isValidUri) {
        return res.status(400).json({ error: "Invalid logo URI format" });
      }
    }
    
    try {
      const user = await storage.updateUserBranding(req.userId!, {
        companyName: companyName ? String(companyName).slice(0, 100) : null,
        companyLogo: companyLogo || null,
      });
      res.json({
        success: true,
        branding: {
          companyName: user.companyName || "",
          companyLogo: user.companyLogo || null,
        },
      });
    } catch (error) {
      console.error("Update branding error:", error);
      res.status(500).json({ error: "Failed to update branding" });
    }
  });

  // Projects routes - protected with auth middleware
  app.get("/api/projects", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const projects = await storage.getProjectsByUser(req.userId!);
      res.json({ success: true, projects });
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ error: "Failed to get projects" });
    }
  });

  app.post("/api/projects", authMiddleware, async (req: AuthRequest, res: Response) => {
    const { userId: _ignored, ...projectData } = req.body;
    
    try {
      const project = await storage.createProject({
        ...projectData,
        userId: req.userId!,
      });
      res.json({ success: true, project });
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    
    try {
      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (existingProject.userId !== req.userId) {
        return res.status(403).json({ error: "Not authorized to update this project" });
      }
      
      const project = await storage.updateProject(id, updates);
      res.json({ success: true, project });
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    try {
      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (existingProject.userId !== req.userId) {
        return res.status(403).json({ error: "Not authorized to delete this project" });
      }
      
      await storage.deleteProject(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // PDF Generation endpoint
  app.post("/api/generate-pdf", async (req: Request, res: Response) => {
    const { project, branding } = req.body;
    
    if (!project) {
      return res.status(400).json({ error: "Project data is required" });
    }

    try {
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      };

      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      };

      const MATERIAL_NAMES: Record<string, string> = {
        "three-tab": "Three Tab Shingles",
        "architectural": "Architectural Shingles",
        "metal-pbr": "Metal PBR Panels",
        "standing-seam": "Standing Seam Metal",
      };

      const materialName = project.selectedMaterial
        ? MATERIAL_NAMES[project.selectedMaterial] || project.selectedMaterial
        : "Standard Materials";
      const breakdown = project.microBreakdown;
      
      const companyName = (branding?.companyName || "RoofMaster 360").replace(/[<>&"']/g, '');
      const companyLogo = branding?.logoUri;
      
      const isValidLogoUri = companyLogo && (
        companyLogo.startsWith('data:image/') || 
        companyLogo.startsWith('https://') ||
        companyLogo.startsWith('file://')
      );
      
      const logoHtml = isValidLogoUri
        ? `<img src="${companyLogo.replace(/"/g, '&quot;')}" alt="Company Logo" style="width: 50px; height: 50px; border-radius: 8px; object-fit: contain;" onerror="this.style.display='none'" />`
        : `<div class="logo-icon">${companyName.charAt(0).toUpperCase()}</div>`;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #1A2332; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #FF6B35; }
    .logo { display: flex; align-items: center; gap: 15px; }
    .logo-icon { width: 50px; height: 50px; background: #FF6B35; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
    .company-name { font-size: 24px; font-weight: bold; }
    .company-subtitle { color: #666; font-size: 14px; }
    .date { color: #666; }
    .section { margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .section-title { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .address { font-size: 18px; font-weight: 600; margin-bottom: 15px; }
    .details { display: flex; gap: 40px; }
    .detail-item { }
    .detail-label { font-size: 12px; color: #666; }
    .detail-value { font-size: 16px; font-weight: 600; }
    .material-section { display: flex; justify-content: space-between; align-items: center; }
    .breakdown-table { width: 100%; border-collapse: collapse; }
    .breakdown-table th, .breakdown-table td { padding: 10px 0; text-align: left; border-bottom: 1px solid #e0e0e0; }
    .breakdown-table th { font-size: 12px; color: #666; text-transform: uppercase; }
    .breakdown-table .amount { text-align: right; }
    .category { font-weight: 600; background: #f0f0f0; padding: 8px; margin-top: 15px; }
    .total-row { border-top: 2px solid #1A2332; font-size: 20px; font-weight: bold; }
    .total-row .amount { color: #FF6B35; }
    .signature-section { margin-top: 50px; display: flex; gap: 50px; }
    .signature-line { flex: 1; border-top: 1px solid #666; padding-top: 10px; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      ${logoHtml}
      <div>
        <div class="company-name">${companyName}</div>
        <div class="company-subtitle">Professional Roofing Estimate</div>
      </div>
    </div>
    <div class="date">${formatDate(project.createdAt)}</div>
  </div>

  <div class="section">
    <div class="section-title">Property Address</div>
    <div class="address">${project.address}</div>
    <div class="details">
      <div class="detail-item">
        <div class="detail-label">Roof Area</div>
        <div class="detail-value">${project.roofArea?.toLocaleString() || 0} sq ft</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Squares</div>
        <div class="detail-value">${project.roofSquares || Math.ceil((project.roofArea || 0) / 100)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Pitch</div>
        <div class="detail-value">${project.pitch || 0}/12</div>
      </div>
    </div>
  </div>

  <div class="section material-section">
    <div>
      <div class="section-title">Material Selection</div>
      <div style="font-size: 18px; font-weight: 600;">${materialName}</div>
    </div>
    <div style="text-align: right;">
      <div class="detail-label">Price per Square</div>
      <div class="detail-value">${formatCurrency(project.materialPricePerSquare || 0)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cost Breakdown</div>
    <table class="breakdown-table">
      <tr class="category"><td colspan="2">Materials</td></tr>
      ${breakdown ? `
      <tr><td>Shingles/Panels</td><td class="amount">${formatCurrency(breakdown.shingles || 0)}</td></tr>
      <tr><td>Waste Factor (12%)</td><td class="amount">${formatCurrency(breakdown.waste || 0)}</td></tr>
      <tr><td>Underlayment</td><td class="amount">${formatCurrency(breakdown.underlayment || 0)}</td></tr>
      <tr><td>Flashing</td><td class="amount">${formatCurrency(breakdown.flashing || 0)}</td></tr>
      <tr><td>Nails/Fasteners</td><td class="amount">${formatCurrency(breakdown.nails || 0)}</td></tr>
      <tr><td>Venting</td><td class="amount">${formatCurrency(breakdown.venting || 0)}</td></tr>
      <tr><td>Ridge Cap</td><td class="amount">${formatCurrency(breakdown.ridgeCap || 0)}</td></tr>
      ` : '<tr><td colspan="2">No breakdown available</td></tr>'}
      
      <tr class="category"><td colspan="2">Labor & Other</td></tr>
      ${breakdown ? `
      <tr><td>Labor (${project.laborHours || 0} hrs x ${formatCurrency(project.laborRate || 0)}/hr)</td><td class="amount">${formatCurrency(breakdown.labor || 0)}</td></tr>
      <tr><td>Additional Costs</td><td class="amount">${formatCurrency(breakdown.additional || 0)}</td></tr>
      ` : ''}
      
      <tr class="total-row">
        <td>Total Estimate</td>
        <td class="amount">${formatCurrency(project.estimateTotal || 0)}</td>
      </tr>
    </table>
  </div>

  <div class="signature-section">
    <div class="signature-line">Contractor Signature</div>
    <div class="signature-line">Client Signature</div>
  </div>

  <div class="footer">
    Generated by RoofMaster 360 | Professional Roofing Estimation Platform
    <br>Contact: support@lionshareanimation.com
  </div>
</body>
</html>`;

      res.json({
        success: true,
        html: htmlContent,
        filename: `RoofMaster360_Estimate_${project.id || Date.now()}.html`,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // AI Assistant endpoint for roofing guidance
  app.post("/api/ai-assistant", async (req: Request, res: Response) => {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI assistant is not configured" });
    }

    try {
      const systemPrompt = `You are RoofMaster AI, a professional roofing industry expert assistant. You help roofing contractors and homeowners with:

1. **Material Selection**: Recommend the best roofing materials (asphalt shingles, metal roofing, tile, slate) based on climate, budget, and aesthetics
2. **Cost Estimation**: Provide typical cost ranges for different roofing projects
3. **Installation Best Practices**: Share tips on proper installation techniques and common mistakes to avoid
4. **Maintenance & Repair**: Advise on roof maintenance schedules and repair techniques
5. **Building Codes & Permits**: General guidance on roofing permits and code requirements
6. **Weather & Climate Considerations**: Help choose materials suitable for specific weather conditions
7. **Energy Efficiency**: Explain options for cool roofs, solar-ready installations, and insulation

Be professional, helpful, and concise. Use industry terminology when appropriate but explain complex concepts clearly. If you don't know something specific, say so and suggest consulting a local professional.

Always prioritize safety - recommend professional help for complex or dangerous tasks.`;

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-10).map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        { role: "user", content: message },
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages,
        max_tokens: 1024,
      });

      const assistantMessage = response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

      res.json({
        success: true,
        message: assistantMessage,
      });
    } catch (error: any) {
      console.error("AI Assistant error:", error);
      res.status(500).json({ 
        error: "Failed to get AI response",
        details: error.message 
      });
    }
  });

  // Stripe webhook placeholder (for future payment integration)
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    res.json({ received: true });
  });

  const httpServer = createServer(app);

  return httpServer;
}

function getOrientation(azimuth: number): string {
  if (azimuth >= 337.5 || azimuth < 22.5) return "North";
  if (azimuth >= 22.5 && azimuth < 67.5) return "Northeast";
  if (azimuth >= 67.5 && azimuth < 112.5) return "East";
  if (azimuth >= 112.5 && azimuth < 157.5) return "Southeast";
  if (azimuth >= 157.5 && azimuth < 202.5) return "South";
  if (azimuth >= 202.5 && azimuth < 247.5) return "Southwest";
  if (azimuth >= 247.5 && azimuth < 292.5) return "West";
  if (azimuth >= 292.5 && azimuth < 337.5) return "Northwest";
  return "Unknown";
}
