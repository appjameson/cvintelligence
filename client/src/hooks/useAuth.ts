import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  credits: number;
  isAdmin: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await fetch('/api/me', {
        credentials: 'include'
      });
      if (res.status === 401) {
        return null;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch user');
      }
      return res.json();
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest('POST', '/api/login', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest('POST', '/api/register', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode começar a usar o sistema.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error('Erro ao fazer logout');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.clear();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    error,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}