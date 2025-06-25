import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Package, Star } from "lucide-react";

interface ProductPackage {
  id: number;
  name: string;
  description: string;
  credits: number;
  price: number;
  originalPrice?: number;
  isPopular: boolean;
  isActive: boolean;
  stripePriceId?: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminProductPackages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ProductPackage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    credits: 0,
    price: 0,
    originalPrice: 0,
    isPopular: false,
    isActive: true,
    stripePriceId: "",
    features: [""]
  });

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["/api/admin/product-packages"],
    retry: false,
  });

  const createPackageMutation = useMutation({
    mutationFn: async (packageData: any) => {
      const res = await apiRequest("POST", "/api/admin/product-packages", packageData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-packages"] });
      toast({
        title: "Pacote criado",
        description: "Novo pacote de produtos foi criado com sucesso.",
      });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar",
        description: error.message || "Erro ao criar pacote",
        variant: "destructive",
      });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, ...packageData }: any) => {
      const res = await apiRequest("PUT", `/api/admin/product-packages/${id}`, packageData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-packages"] });
      toast({
        title: "Pacote atualizado",
        description: "Pacote foi atualizado com sucesso.",
      });
      setEditingPackage(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Erro ao atualizar pacote",
        variant: "destructive",
      });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/product-packages/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-packages"] });
      toast({
        title: "Pacote removido",
        description: "Pacote foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message || "Erro ao remover pacote",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      credits: 0,
      price: 0,
      originalPrice: 0,
      isPopular: false,
      isActive: true,
      stripePriceId: "",
      features: [""]
    });
  };

  const handleEdit = (pkg: ProductPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      credits: pkg.credits,
      price: pkg.price / 100, // Convert from cents
      originalPrice: pkg.originalPrice ? pkg.originalPrice / 100 : 0,
      isPopular: pkg.isPopular,
      isActive: pkg.isActive,
      stripePriceId: pkg.stripePriceId || "",
      features: pkg.features
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const packageData = {
      ...formData,
      price: Math.round(formData.price * 100), // Convert to cents
      originalPrice: formData.originalPrice > 0 ? Math.round(formData.originalPrice * 100) : null,
      features: formData.features.filter(f => f.trim() !== "")
    };

    if (editingPackage) {
      updatePackageMutation.mutate({ id: editingPackage.id, ...packageData });
    } else {
      createPackageMutation.mutate(packageData);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const PackageForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Pacote</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Pacote Premium"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição do pacote"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="credits">Quantidade de Créditos</Label>
          <Input
            id="credits"
            type="number"
            value={formData.credits}
            onChange={(e) => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
            min="1"
            required
          />
        </div>

        <div>
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            min="0"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="originalPrice">Preço Original (R$) - Opcional</Label>
        <Input
          id="originalPrice"
          type="number"
          step="0.01"
          value={formData.originalPrice}
          onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) }))}
          min="0"
          placeholder="Para mostrar desconto"
        />
      </div>

      <div>
        <Label htmlFor="stripePriceId">Stripe Price ID</Label>
        <Input
          id="stripePriceId"
          value={formData.stripePriceId}
          onChange={(e) => setFormData(prev => ({ ...prev, stripePriceId: e.target.value }))}
          placeholder="price_..."
        />
      </div>

      <div>
        <Label>Características</Label>
        {formData.features.map((feature, index) => (
          <div key={index} className="flex gap-2 mt-2">
            <Input
              value={feature}
              onChange={(e) => updateFeature(index, e.target.value)}
              placeholder="Característica do pacote"
            />
            {formData.features.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeFeature(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFeature}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Característica
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="isPopular"
            checked={formData.isPopular}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPopular: checked }))}
          />
          <Label htmlFor="isPopular">Pacote Popular</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Ativo</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={createPackageMutation.isPending || updatePackageMutation.isPending}>
          {editingPackage ? "Atualizar" : "Criar"} Pacote
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setEditingPackage(null);
            setIsCreateModalOpen(false);
            resetForm();
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pacotes de Produtos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os pacotes de créditos disponíveis para compra
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pacote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Pacote</DialogTitle>
            </DialogHeader>
            <PackageForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(packages as ProductPackage[]).map((pkg) => (
          <Card key={pkg.id} className={`relative ${!pkg.isActive ? 'opacity-60' : ''}`}>
            {pkg.isPopular && (
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-yellow-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{pkg.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pkg)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePackageMutation.mutate(pkg.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-gray-600">{pkg.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  R$ {(pkg.price / 100).toFixed(2)}
                </span>
                {pkg.originalPrice && (
                  <span className="text-gray-500 line-through">
                    R$ {(pkg.originalPrice / 100).toFixed(2)}
                  </span>
                )}
              </div>
              
              <div className="text-center">
                <Badge variant="secondary">
                  {pkg.credits} créditos
                </Badge>
              </div>
              
              <ul className="space-y-1 text-sm">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Status: {pkg.isActive ? 'Ativo' : 'Inativo'}</span>
                {pkg.stripePriceId && (
                  <span>Stripe: {pkg.stripePriceId}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingPackage && (
        <Dialog open={!!editingPackage} onOpenChange={() => setEditingPackage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Pacote</DialogTitle>
            </DialogHeader>
            <PackageForm />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}