import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "./types";
import { DashboardScreen } from "../features/dashboard/screens/DashboardScreen";
import { CalendarScreen } from "../features/calendar/screens/CalendarScreen";
import { AccountsScreen } from "../features/accounts/screens/AccountsScreen";
import { ReportsScreen } from "../features/reports/screens/ReportsScreen";
import { ProfileScreen } from "../features/profile/screens/ProfileScreen";
import { Colors } from "../constants/theme";

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          fontWeight: "700",
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: "Lịch chi tiêu" }}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{ title: "Ví & TK" }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: "Báo cáo" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Cá nhân" }}
      />
    </Tab.Navigator>
  );
};
