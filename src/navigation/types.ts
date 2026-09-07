import { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Accounts: undefined;
  Reports: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
};
