// client/src/components/PromptSettingsForm.tsx - VERSÃO FINAL COMPLETA

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { EditorView } from "@codemirror/view";
import { Eye, Edit, Trash2, XCircle, Save } from "lucide-react";

// Funções para comunicar com a API
async function fetchSettings() {
  const res = await fetch('/api/admin/settings');
  if (!res.ok) throw new Error('Falha ao carregar configurações');
  return res.json();
}

async function saveSettings(settings: { geminiPrompt: string }) {
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Falha ao salvar o prompt');
  }
  return res.json();
}

export default function PromptSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: fetchSettings,
  });

  // Atualiza o estado do formulário quando os dados são carregados
  useEffect(() => {
  if (settings) {
    // A API agora envia o prompt customizado OU o padrão, então apenas limpamos o valor se for nulo.
    setPrompt(settings.GEMINI_PROMPT_CV_ANALYSIS || ''); 
  }
}, [settings]);

  // Mutação para salvar ou deletar o prompt
  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Prompt salvo com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      setIsDialogOpen(false); // Fecha o modal após salvar
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    }
  });

  // Abre a janela flutuante em modo de visualização ou edição
  const handleOpenDialog = (edit = false) => {
      // Simplesmente usamos o valor que veio da API, que já é o correto.
      const currentPrompt = settings?.GEMINI_PROMPT_CV_ANALYSIS || '';
      setPrompt(currentPrompt);
      setIsEditMode(edit);
      setIsDialogOpen(true);
  };

  // Salva as alterações
  const handleSave = () => {
    mutation.mutate({ geminiPrompt: prompt });
  };

  // Exclui o prompt customizado (salvando uma string vazia)
  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir o prompt customizado? A aplicação voltará a usar o prompt padrão do sistema.")) {
      mutation.mutate({ geminiPrompt: '' });
    }
  };

  if (isLoading) return <p className="text-sm text-slate-500">Carregando...</p>;

  return (
    <>
      <p className="text-slate-600 mb-4">Gerencie o prompt principal usado pela IA para analisar os currículos.</p>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(false)}>
          <Eye className="mr-2" size={16} />
          Visualizar
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(true)}>
          <Edit className="mr-2" size={16} />
          Editar
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={!settings?.GEMINI_PROMPT_CV_ANALYSIS || mutation.isPending}>
          <Trash2 className="mr-2" size={16} />
          Excluir
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{isEditMode ? 'Editar Prompt da IA' : 'Visualizar Prompt da IA'}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-grow overflow-y-auto px-1">
            <CodeMirror
              value={prompt}
              height="100%"
              theme={dracula}
              extensions={[javascript({ jsx: true }), EditorView.lineWrapping]}
              onChange={(value) => isEditMode && setPrompt(value)}
              readOnly={!isEditMode}
            />
          </div>
          
          <DialogFooter className="p-6 pt-4 border-t">
            {!isEditMode ? (
              <Button onClick={() => setIsEditMode(true)}>
                <Edit className="mr-2" size={16} />
                Ativar Modo Edição
              </Button>
            ) : (
              <div className="flex w-full justify-end space-x-2">
                <DialogClose asChild>
                  <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={mutation.isPending}>
                  <Save className="mr-2" size={16} />
                  {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}