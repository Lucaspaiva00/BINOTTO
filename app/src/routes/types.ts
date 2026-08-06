import { NavigatorScreenParams } from "@react-navigation/native";
import { AuthStackParamList } from "@/navigation/types";
import { UserRegisterResponse } from "@/types/social";

export type PublicStackParamList = {
  Login: undefined;
  RegisterTechnician: undefined;
  RegisterWorkshop: undefined;
  CompleteRegistration:
    | {
        phone?: string;
        workshopName?: string;
        userId: number;
      }
    | undefined;
  CompleteRegistrationSocial: UserRegisterResponse | undefined; 
  RecoverPassword: undefined;
  RecoverByEmail: undefined;
  OtpValidation: { email: string };
  CameraPermission: { onGrant: () => void };
  GalleryPermission: { onGrant: () => void };
  NotificationPermission: { onGrant: () => void };
};

export type TechnicianStackParamList = {
  Dashboard: { tab?: string; } | undefined;
  Calendar: undefined;
  Inspections: undefined;
  Settings: undefined;
  NewService: {
    backTo?: keyof TechnicianStackParamList;
  } | undefined;
  NewInspection: {
    serviceId?: number;
  } | undefined;
  InspectionDetail: {
    inspectionId: number;
    backTo?: keyof TechnicianStackParamList;
    backToParams?: {
      serviceId?: number;
    };
  };
  InspectionSaved: {
    inspectionId: number;
    backTo?: keyof TechnicianStackParamList;
  };
  ServiceDetail: {
    serviceId: number;
    backTo?: keyof TechnicianStackParamList;
  };
  ServiceExecution: {
    serviceId: number;
    backTo?: keyof TechnicianStackParamList;
  };
  ServiceAccept: {
    serviceId: number;
    backTo?: keyof TechnicianStackParamList;
  };
  CompleteCar: {
    serviceId: number;
    backTo?: keyof TechnicianStackParamList;
  };
};

export type WorkshopStackParamList = {
  Dashboard: { tab?: string; } | undefined;
  Calendar: undefined;
  Inspections: undefined;
  Technicians: undefined;
  Settings: undefined;
  ServiceUpdate: { serviceId: number; };
  ServiceDetail: { serviceId: number; };
  ServiceConfirm: { serviceId: number; };
  InspectionDetails: { inspectionId: number; };
  NewInspection: undefined;
};

export type PrivateStackParamList = {
  TechnicianTabs: NavigatorScreenParams<TechnicianStackParamList>;
  WorkshopTabs: NavigatorScreenParams<WorkshopStackParamList>;
} & AuthStackParamList;

export type RootStackParamList = {
  PublicStack: NavigatorScreenParams<PublicStackParamList>;
  PrivateStack: NavigatorScreenParams<PrivateStackParamList>;
};
