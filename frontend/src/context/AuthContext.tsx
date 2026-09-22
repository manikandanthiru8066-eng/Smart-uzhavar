import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subsidyApi } from '../api/client';

export interface FarmerCropItem {
  id?: number;
  cropGrown: string;
  districtId?: number;
  districtName?: string;
  talukId?: number;
  talukName?: string;
  blockId?: number;
  block?: string;
  landSizeAcres?: number;
  landSizeHectares?: number;
  irrigationType?: string;
  cropDurationMonths?: number;
  season?: string;
}


export interface FarmerProfileData {
  username: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role?: string;

  // Legacy compatibility fields
  district?: string;
  districtName?: string;
  block?: string;
  blockId?: number;
  cropGrown?: string;
  cropDurationMonths?: number;
  season?: string;
  irrigationType?: string;
  landSizeAcres?: number;
  landSizeHectares?: number;

  // 1-to-many Crop Profiles
  crops?: FarmerCropItem[];
}

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: string | null;
  isAdmin: boolean;
  profile: FarmerProfileData | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  signup: (data: Record<string, any>) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Record<string, any>) => Promise<FarmerProfileData>;
  addCropProfile: (cropData: Record<string, any>) => Promise<FarmerProfileData>;
  updateCropProfile: (id: number, cropData: Record<string, any>) => Promise<FarmerProfileData>;
  deleteCropProfile: (id: number) => Promise<FarmerProfileData>;
}

export function parseJwtRole(token: string | null): string {
  if (!token) return 'FARMER';
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return 'FARMER';
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return (parsed.role || 'FARMER').toUpperCase();
  } catch {
    return 'FARMER';
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));
  const [role, setRole] = useState<string | null>(() => {
    const saved = localStorage.getItem('role');
    if (saved) return saved;
    const t = localStorage.getItem('token');
    return t ? parseJwtRole(t) : null;
  });
  const [profile, setProfile] = useState<FarmerProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await subsidyApi.get<FarmerProfileData>('/api/profile');
      setProfile(res.data);
      if (res.data?.username) {
        setUsername(res.data.username);
        localStorage.setItem('username', res.data.username);
      }
      if (res.data?.role) {
        setRole(res.data.role);
        localStorage.setItem('role', res.data.role);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        logout();
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await fetchProfile();
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (u: string, p: string) => {
    const res = await subsidyApi.post('/api/auth/login', { username: u, password: p });
    const newToken = res.data.token;
    const returnedUser = res.data.username || u;
    const returnedRole = (res.data.role || parseJwtRole(newToken) || 'FARMER').toUpperCase();

    localStorage.setItem('token', newToken);
    localStorage.setItem('username', returnedUser);
    localStorage.setItem('role', returnedRole);
    setToken(newToken);
    setUsername(returnedUser);
    setRole(returnedRole);

    try {
      const profileRes = await subsidyApi.get<FarmerProfileData>('/api/profile', {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      setProfile(profileRes.data);
      if (profileRes.data?.role) {
        setRole(profileRes.data.role);
        localStorage.setItem('role', profileRes.data.role);
      }
    } catch {
      setProfile({ username: returnedUser, fullName: returnedUser, role: returnedRole, crops: [] });
    }
  };

  const signup = async (data: Record<string, any>) => {
    const res = await subsidyApi.post('/api/auth/signup', data);
    const newToken = res.data.token;
    const returnedUser = res.data.username || data.username;

    localStorage.setItem('token', newToken);
    localStorage.setItem('username', returnedUser);
    setToken(newToken);
    setUsername(returnedUser);

    try {
      const profileRes = await subsidyApi.get<FarmerProfileData>('/api/profile', {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      setProfile(profileRes.data);
    } catch {
      setProfile({
        username: returnedUser,
        fullName: data.fullName || returnedUser,
        email: data.email,
        phoneNumber: data.phoneNumber,
        districtName: data.districtName,
        cropGrown: data.cropGrown,
        landSizeHectares: data.landSizeHectares,
        crops: [],
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setToken(null);
    setUsername(null);
    setRole(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (data: Record<string, any>) => {
    const res = await subsidyApi.put<FarmerProfileData>('/api/profile', data);
    setProfile(res.data);
    return res.data;
  };

  const addCropProfile = async (cropData: Record<string, any>) => {
    const res = await subsidyApi.post<FarmerProfileData>('/api/profile/crops', cropData);
    setProfile(res.data);
    return res.data;
  };

  const updateCropProfile = async (id: number, cropData: Record<string, any>) => {
    const res = await subsidyApi.put<FarmerProfileData>(`/api/profile/crops/${id}`, cropData);
    setProfile(res.data);
    return res.data;
  };

  const deleteCropProfile = async (id: number) => {
    const res = await subsidyApi.delete<FarmerProfileData>(`/api/profile/crops/${id}`);
    setProfile(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
        isAdmin: role === 'ADMIN',
        profile,
        isAuthenticated: !!token,
        loading,
        login,
        signup,
        logout,
        refreshProfile,
        updateProfile,
        addCropProfile,
        updateCropProfile,
        deleteCropProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
