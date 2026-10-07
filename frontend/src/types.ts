export const categoriasAtivos = [
  ['notebook', 'Notebook'], ['smartphone', 'Smartphone'], ['tablet', 'Tablet'],
] as const;
export type CategoriaAtivo = (typeof categoriasAtivos)[number][0];
export interface ConsultaUsuarioResponse {
  usuario: string;
  nome?: string | null;
  sucesso: boolean;
  origem: string;
  ativos: Record<CategoriaAtivo, string | null> & Partial<Record<'desktop' | 'monitor' | 'telFixa' | 'coletor' | 'palm' | 'certificado', string | null>>;
  mensagem: string | null;
}
