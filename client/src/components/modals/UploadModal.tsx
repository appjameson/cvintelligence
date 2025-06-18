import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Upload, FileText, X, Gift, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

interface AnalysisResponse {
  analysisId: number;
  analysis: any;
  creditsRemaining: number;
}

export default function UploadModal({ open, onClose }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('cv', file);
      
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao analisar currículo');
      }

      return response.json() as Promise<AnalysisResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: "Análise Concluída!",
        description: `Seu currículo foi analisado com sucesso. Restam ${data.creditsRemaining} créditos.`,
      });
      
      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      
      // Close modal and redirect to analysis
      onClose();
      setLocation(`/analysis/${data.analysisId}`);
      setSelectedFile(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sessão Expirada",
          description: "Você será redirecionado para fazer login novamente.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('Créditos insuficientes')) {
        toast({
          title: "Créditos Insuficientes",
          description: "Você não tem créditos suficientes para esta análise.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro na Análise",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const handleFileSelect = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Use apenas arquivos PDF, DOC ou DOCX.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    if ((user?.credits || 0) <= 0) {
      toast({
        title: "Créditos Insuficientes",
        description: "Você não tem créditos suficientes para esta análise.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  const handleClose = () => {
    if (!uploadMutation.isPending) {
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-slate-900">
            Faça Upload do seu Currículo
          </DialogTitle>
          <p className="text-center text-slate-600">
            Aceita arquivos PDF, DOC e DOCX
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : selectedFile 
                ? 'border-green-500 bg-green-50' 
                : 'border-slate-300 hover:border-blue-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInputChange}
              disabled={uploadMutation.isPending}
            />

            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="mx-auto text-green-500" size={48} />
                <p className="font-semibold text-slate-900">{selectedFile.name}</p>
                <p className="text-sm text-slate-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  disabled={uploadMutation.isPending}
                >
                  Trocar Arquivo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto text-blue-500" size={48} />
                <p className="font-semibold text-slate-900">
                  Clique aqui ou arraste seu arquivo
                </p>
                <p className="text-sm text-slate-600">Máximo 5MB</p>
              </div>
            )}
          </div>

          {/* Credits Info */}
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Gift size={20} />
              <span className="font-semibold">
                Você tem {user?.credits || 0} créditos disponíveis
              </span>
            </div>
            {(user?.credits || 0) <= 0 && (
              <div className="flex items-center justify-center space-x-2 text-red-600 mt-2">
                <AlertCircle size={16} />
                <span className="text-sm">
                  Créditos insuficientes. 
                  <Button 
                    variant="link" 
                    className="p-0 ml-1 text-red-600"
                    onClick={() => {
                      onClose();
                      setLocation('/checkout');
                    }}
                  >
                    Compre mais créditos
                  </Button>
                </span>
              </div>
            )}
          </div>

          {/* Analysis Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span>Analisando seu currículo...</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-sm text-slate-600 text-center">
                Nossa IA está avaliando seu currículo. Isso pode levar alguns segundos.
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!selectedFile || uploadMutation.isPending || (user?.credits || 0) <= 0}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl disabled:opacity-50"
          >
            {uploadMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Analisando...
              </div>
            ) : (
              <>
                <Upload className="mr-2" size={20} />
                Analisar Currículo
              </>
            )}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={handleClose}
          disabled={uploadMutation.isPending}
        >
          <X size={20} />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
