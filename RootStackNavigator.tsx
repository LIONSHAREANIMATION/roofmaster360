import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import NewProjectScreen from "@/screens/NewProjectScreen";
import CostInputScreen from "@/screens/CostInputScreen";
import EstimatePreviewScreen from "@/screens/EstimatePreviewScreen";
import SignInScreen from "@/screens/SignInScreen";
import FeedbackScreen from "@/screens/FeedbackScreen";
import LegalScreen from "@/screens/LegalScreen";
import AIAssistantScreen from "@/screens/AIAssistantScreen";
import CompanyBrandingScreen from "@/screens/CompanyBrandingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

export type RootStackParamList = {
  Main: undefined;
  NewProject: undefined;
  CostInput: { projectId: string };
  EstimatePreview: { projectId: string };
  SignIn: undefined;
  Feedback: undefined;
  Legal: { type: "terms" | "privacy" };
  AIAssistant: undefined;
  CompanyBranding: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();

  const BackButton = ({ onPress }: { onPress: () => void }) => (
    <HeaderButton onPress={onPress}>
      <Feather name="arrow-left" size={24} color={theme.text} />
    </HeaderButton>
  );

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewProject"
        component={NewProjectScreen}
        options={({ navigation }) => ({
          presentation: "card",
          headerTitle: "New Project",
          headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="CostInput"
        component={CostInputScreen}
        options={({ navigation }) => ({
          presentation: "card",
          headerTitle: "Cost Details",
          headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="EstimatePreview"
        component={EstimatePreviewScreen}
        options={({ navigation }) => ({
          presentation: "card",
          headerTitle: "Estimate Preview",
          headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={({ navigation }) => ({
          presentation: "card",
          headerTitle: "Sign In",
          headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={({ navigation }) => ({
          presentation: "card",
          headerTitle: "Send Feedback",
          headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="Legal"
        component={LegalScreen}
        options={({ route, navigation }) => ({
          presentation: "card",
          headerTitle: route.params.type === "terms" ? "Terms of Service" : "Privacy Policy",
          headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={({ navigation }) => ({
          presentation: "card",
          headerTitle: "AI Assistant",
          headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="CompanyBranding"
        component={CompanyBrandingScreen}
        options={({ navigation }) => ({
          presentation: "card",
          headerTitle: "Company Branding",
          headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
        })}
      />
    </Stack.Navigator>
  );
}
