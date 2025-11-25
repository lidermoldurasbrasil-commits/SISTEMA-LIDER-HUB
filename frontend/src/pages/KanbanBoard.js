import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, X, Edit2, Trash2, MoreVertical, Tag, Calendar, CheckSquare, MessageSquare, Clock, User, Paperclip, Copy, Archive, ArrowRight, Activity, HelpCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const LABEL_COLORS = [
  { value: 'red', label: 'Vermelho', hex: '#EF4444' },
  { value: 'blue', label: 'Azul', hex: '#3B82F6' },
  { value: 'purple', label: 'Roxo', hex: '#8B5CF6' },
  { value: 'yellow', label: 'Amarelo', hex: '#F59E0B' },
  { value: 'green', label: 'Verde', hex: '#10B981' },
  { value: 'orange', label: 'Laranja', hex: '#F97316' },
  { value: 'pink', label: 'Rosa', hex: '#EC4899' },
  { value: 'indigo', label: 'Índigo', hex: '#6366F1' },
  { value: 'teal', label: 'Azul Petróleo', hex: '#14B8A6' },
  { value: 'lime', label: 'Lima', hex: '#84CC16' },
  { value: 'cyan', label: 'Ciano', hex: '#06B6D4' },
  { value: 'emerald', label: 'Esmeralda', hex: '#059669' },
  { value: 'amber', label: 'Âmbar', hex: '#F59E0B' },
  { value: 'rose', label: 'Rosa Escuro', hex: '#F43F5E' },
  { value: 'violet', label: 'Violeta', hex: '#7C3AED' },
  { value: 'fuchsia', label: 'Fúcsia', hex: '#D946EF' },
  { value: 'sky', label: 'Azul Céu', hex: '#0EA5E9' },
  { value: 'slate', label: 'Ardósia', hex: '#64748B' },
  { value: 'gray', label: 'Cinza', hex: '#6B7280' },
  { value: 'black', label: 'Preto', hex: '#1F2937' },
];

// Componente de Avatar para Membros
const MemberAvatar = ({ username, size = 'sm' }) => {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(/[\s-_]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const getColorFromName = (name) => {
    const colors = [
      'bg-gradient-to-br from-purple-500 to-pink-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-green-500 to-emerald-500',
      'bg-gradient-to-br from-orange-500 to-red-500',
      'bg-gradient-to-br from-indigo-500 to-purple-500',
      'bg-gradient-to-br from-teal-500 to-blue-500',
      'bg-gradient-to-br from-rose-500 to-pink-500',
      'bg-gradient-to-br from-amber-500 to-orange-500',
    ];
    // Proteção contra undefined/null
    if (!name) return colors[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const initials = getInitials(username);
  const colorClass = getColorFromName(username);
  
  return (
    <div 
      className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white hover:scale-110 transition-transform cursor-pointer`}
      title={username}
    >
      {initials}
    </div>
  );
};

export default function KanbanBoard() {
  const [colunas, setColunas] = useState([]);
  const [cards, setCards] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalColunaAberto, setModalColunaAberto] = useState(false);
  const [modalCardAberto, setModalCardAberto] = useState(false);
  const [cardDetalheAberto, setCardDetalheAberto] = useState(false);
  const [colunaEditando, setColunaEditando] = useState(null);
  const [cardEditando, setCardEditando] = useState(null);
  const [cardSelecionado, setCardSelecionado] = useState(null);
  const [colunaIdParaNovoCard, setColunaIdParaNovoCard] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('detalhes'); // detalhes, atividades

  // Form states
  const [formColuna, setFormColuna] = useState({ titulo: '', cor: null });
  const [formCard, setFormCard] = useState({
    titulo: '',
    descricao: '',
    labels: [],
    data_vencimento: '',
    assignees: []
  });

  // Estados para funcionalidades extras
  const [novoItemChecklist, setNovoItemChecklist] = useState('');
  const [membroNovoItem, setMembroNovoItem] = useState(''); // Membro para novo item
  const [mostrarSeletorMembroNovoItem, setMostrarSeletorMembroNovoItem] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [novoAnexo, setNovoAnexo] = useState({ nome: '', url: '', tipo: 'link' });
  const [tipoAnexo, setTipoAnexo] = useState('link'); // 'link' ou 'upload'
  const [arquivoUpload, setArquivoUpload] = useState(null);
  const [novoMembro, setNovoMembro] = useState('');
  const [modalAnexoAberto, setModalAnexoAberto] = useState(false);
  const [modalMoverAberto, setModalMoverAberto] = useState(false);
  
  // Estados para "A Resolver"
  const [novaQuestao, setNovaQuestao] = useState('');
  const [questaoExpandida, setQuestaoExpandida] = useState(null);
  const [novaResposta, setNovaResposta] = useState('');
  
  // Estados para atribuir membros
  const [atribuindoMembroItem, setAtribuindoMembroItem] = useState(null); // ID do item checklist
  const [atribuindoMembroQuestao, setAtribuindoMembroQuestao] = useState(null); // ID da questão
  const [atribuindoMembroLabel, setAtribuindoMembroLabel] = useState(null); // Cor da label
  const [membrosDisponiveis, setMembrosDisponiveis] = useState([]);
  
  // Modal de cadastro rápido de membro
  const [modalCadastroMembroAberto, setModalCadastroMembroAberto] = useState(false);
  const [novoMembroForm, setNovoMembroForm] = useState({ username: '', nome: '', password: '123' });
  const [modalCopiarAberto, setModalCopiarAberto] = useState(false);
  const [colunaSelecionadaMover, setColunaSelecionadaMover] = useState(null);
  const [modalLabelAberto, setModalLabelAberto] = useState(false);
  const [adicionandoCardColuna, setAdicionandoCardColuna] = useState(null);
  const [textoNovoCard, setTextoNovoCard] = useState('');
  const [modalFundoAberto, setModalFundoAberto] = useState(false);
  const [fundoSelecionado, setFundoSelecionado] = useState('gradient-1');
  
  // Estados para labels editáveis
  const [labelsEditando, setLabelsEditando] = useState([]);
  const [editandoLabelIndex, setEditandoLabelIndex] = useState(null);
  const [buscaLabel, setBuscaLabel] = useState('');
  const [criandoLabel, setCriandoLabel] = useState(false);
  const [novaLabel, setNovaLabel] = useState({ name: '', color: 'red' });
  const [editandoLabel, setEditandoLabel] = useState(null);
  
  // Estado global para nomes personalizados de etiquetas (persiste mesmo quando desmarcada)
  const [labelsGlobais, setLabelsGlobais] = useState({});
  
  // Estados para descrição editável
  const [editandoDescricao, setEditandoDescricao] = useState(false);
  const [descricaoTemp, setDescricaoTemp] = useState('');
  
  // Estados para sub-tarefas
  const [adicionandoSubtarefa, setAdicionandoSubtarefa] = useState(null);
  const [textoSubtarefa, setTextoSubtarefa] = useState('');
  
  // Estados para sub-subtarefas (aninhadas)
  const [adicionandoSubSubtarefa, setAdicionandoSubSubtarefa] = useState(null);
  const [textoSubSubtarefa, setTextoSubSubtarefa] = useState('');
  
  // Estados para capa
  const [modalCapaAberto, setModalCapaAberto] = useState(false);
  const [capaUrl, setCapaUrl] = useState('');
  const [capaCor, setCapaCor] = useState('');
  const [tipoCapaSelecionado, setTipoCapaSelecionado] = useState('cor'); // 'cor' ou 'imagem'
  
  // Estados para data
  const [modalDataAberto, setModalDataAberto] = useState(false);
  const [dataVencimento, setDataVencimento] = useState('');
  const [horaVencimento, setHoraVencimento] = useState('12:00');
  
  // Estados para membros
  const [modalMembrosAberto, setModalMembrosAberto] = useState(false);

  const fundos = [
    { id: 'gradient-1', nome: 'Índigo Roxo', classe: 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100' },
    { id: 'gradient-2', nome: 'Azul Claro', classe: 'bg-gradient-to-br from-blue-100 via-cyan-50 to-teal-100' },
    { id: 'gradient-3', nome: 'Rosa Suave', classe: 'bg-gradient-to-br from-pink-100 via-rose-50 to-orange-100' },
    { id: 'gradient-4', nome: 'Verde Menta', classe: 'bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100' },
    { id: 'gradient-5', nome: 'Laranja Pêssego', classe: 'bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100' },
    { id: 'gradient-6', nome: 'Oceano', classe: 'bg-gradient-to-br from-blue-200 via-indigo-100 to-purple-200' },
    { id: 'gradient-7', nome: 'Pôr do Sol', classe: 'bg-gradient-to-br from-orange-200 via-pink-100 to-purple-200' },
    { id: 'gradient-8', nome: 'Floresta', classe: 'bg-gradient-to-br from-green-200 via-emerald-100 to-teal-200' },
    { id: 'solid-blue', nome: 'Azul Sólido', classe: 'bg-blue-600' },
    { id: 'solid-purple', nome: 'Roxo Sólido', classe: 'bg-purple-600' },
    { id: 'solid-green', nome: 'Verde Sólido', classe: 'bg-green-600' },
    { id: 'solid-red', nome: 'Vermelho Sólido', classe: 'bg-red-600' },
    { id: 'image-1', nome: 'Padrão 1', classe: 'bg-[url("https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80")] bg-cover' },
    { id: 'image-2', nome: 'Padrão 2', classe: 'bg-[url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80")] bg-cover' },
  ];

  // Função para calcular nível de combustível baseado no prazo
  const calcularCombustivel = (dataVencimento) => {
    if (!dataVencimento) return { nivel: 100, cor: 'bg-gray-300', texto: 'Sem prazo' };
    
    const agora = new Date();
    const vencimento = new Date(dataVencimento);
    const diferencaMs = vencimento - agora;
    const diferencaDias = diferencaMs / (1000 * 60 * 60 * 24);
    
    // Já venceu
    if (diferencaDias < 0) {
      return { 
        nivel: 0, 
        cor: 'bg-red-600', 
        texto: 'Vencido!',
        badge: 'bg-red-100 text-red-800 border-red-300'
      };
    }
    
    // Menos de 1 dia
    if (diferencaDias < 1) {
      const horas = Math.floor(diferencaMs / (1000 * 60 * 60));
      return { 
        nivel: 15, 
        cor: 'bg-red-500', 
        texto: `${horas}h restantes`,
        badge: 'bg-red-100 text-red-800 border-red-300'
      };
    }
    
    // 1-2 dias
    if (diferencaDias < 2) {
      return { 
        nivel: 30, 
        cor: 'bg-orange-500', 
        texto: '1 dia restante',
        badge: 'bg-orange-100 text-orange-800 border-orange-300'
      };
    }
    
    // 2-3 dias
    if (diferencaDias < 3) {
      return { 
        nivel: 50, 
        cor: 'bg-yellow-500', 
        texto: `${Math.floor(diferencaDias)} dias`,
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      };
    }
    
    // 3-7 dias
    if (diferencaDias < 7) {
      return { 
        nivel: 70, 
        cor: 'bg-blue-500', 
        texto: `${Math.floor(diferencaDias)} dias`,
        badge: 'bg-blue-100 text-blue-800 border-blue-300'
      };
    }
    
    // Mais de 7 dias
    return { 
      nivel: 100, 
      cor: 'bg-green-500', 
      texto: `${Math.floor(diferencaDias)} dias`,
      badge: 'bg-green-100 text-green-800 border-green-300'
    };
  };

  useEffect(() => {
    carregarDados();
    const fundoSalvo = localStorage.getItem('kanban-fundo');
    if (fundoSalvo) setFundoSelecionado(fundoSalvo);
  }, []);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const colunasResponse = await axios.get(`${BACKEND_URL}/api/kanban/colunas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setColunas(colunasResponse.data);
      
      const cardsResponse = await axios.get(`${BACKEND_URL}/api/kanban/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const cardsOrganizados = {};
      colunasResponse.data.forEach(col => {
        cardsOrganizados[col.id] = cardsResponse.data
          .filter(card => card.coluna_id === col.id && !card.arquivado)
          .sort((a, b) => a.posicao - b.posicao);
      });
      
      setCards(cardsOrganizados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar o quadro');
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'column') {
      const novasColunas = Array.from(colunas);
      const [removed] = novasColunas.splice(source.index, 1);
      novasColunas.splice(destination.index, 0, removed);
      const colunasComPosicao = novasColunas.map((col, index) => ({ id: col.id, posicao: index }));
      setColunas(novasColunas);

      try {
        const token = localStorage.getItem('token');
        await axios.post(`${BACKEND_URL}/api/kanban/colunas/reordenar`, { colunas: colunasComPosicao }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (error) {
        toast.error('Erro ao reordenar colunas');
        carregarDados();
      }
    } else {
      const colunaOrigemId = source.droppableId;
      const colunaDestinoId = destination.droppableId;

      if (colunaOrigemId === colunaDestinoId) {
        const novosCards = Array.from(cards[colunaOrigemId]);
        const [cardMovido] = novosCards.splice(source.index, 1);
        novosCards.splice(destination.index, 0, cardMovido);
        setCards({ ...cards, [colunaOrigemId]: novosCards });
      } else {
        const cardsOrigem = Array.from(cards[colunaOrigemId]);
        const cardsDestino = Array.from(cards[colunaDestinoId] || []);
        const [cardMovido] = cardsOrigem.splice(source.index, 1);
        cardsDestino.splice(destination.index, 0, cardMovido);
        setCards({ ...cards, [colunaOrigemId]: cardsOrigem, [colunaDestinoId]: cardsDestino });
      }

      try {
        const token = localStorage.getItem('token');
        const cardId = cards[colunaOrigemId][source.index].id;
        await axios.post(`${BACKEND_URL}/api/kanban/cards/mover`, { card_id: cardId, coluna_destino_id: colunaDestinoId, nova_posicao: destination.index }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (error) {
        toast.error('Erro ao mover card');
        carregarDados();
      }
    }
  };

  const abrirModalColuna = (coluna = null) => {
    if (coluna) {
      setColunaEditando(coluna);
      setFormColuna({ titulo: coluna.titulo, cor: coluna.cor });
    } else {
      setColunaEditando(null);
      setFormColuna({ titulo: '', cor: null });
    }
    setModalColunaAberto(true);
  };

  const salvarColuna = async () => {
    if (!formColuna.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (colunaEditando) {
        await axios.put(`${BACKEND_URL}/api/kanban/colunas/${colunaEditando.id}`, formColuna, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Coluna atualizada!');
      } else {
        await axios.post(`${BACKEND_URL}/api/kanban/colunas`, formColuna, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Coluna criada!');
      }
      setModalColunaAberto(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao salvar coluna');
    }
  };

  const deletarColuna = async (colunaId) => {
    if (!window.confirm('Tem certeza? Isso vai deletar todos os cards desta coluna também.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/kanban/colunas/${colunaId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Coluna deletada!');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao deletar coluna');
    }
  };

  const abrirModalCard = (colunaId, card = null) => {
    setColunaIdParaNovoCard(colunaId);
    if (card) {
      setCardEditando(card);
      setFormCard({ titulo: card.titulo, descricao: card.descricao || '', labels: card.labels || [], data_vencimento: card.data_vencimento || '', assignees: card.assignees || [] });
    } else {
      setCardEditando(null);
      setFormCard({ titulo: '', descricao: '', labels: [], data_vencimento: '', assignees: [] });
    }
    setModalCardAberto(true);
  };

  const criarCardRapido = async (colunaId) => {
    if (!textoNovoCard.trim()) {
      toast.error('Digite um título para o card');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/kanban/cards`, { titulo: textoNovoCard.trim(), coluna_id: colunaId, descricao: '', labels: [] }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Card criado!');
      setTextoNovoCard('');
      setAdicionandoCardColuna(null);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao criar card');
    }
  };

  const selecionarFundo = (fundoId) => {
    setFundoSelecionado(fundoId);
    localStorage.setItem('kanban-fundo', fundoId);
    setModalFundoAberto(false);
  };

  // ========== LABELS EDITÁVEIS ==========
  const abrirModalLabels = () => {
    if (cardSelecionado) {
      setLabelsEditando(cardSelecionado.labels || []);
      
      // Carregar nomes personalizados de todas as labels do card
      const novosLabelsGlobais = { ...labelsGlobais };
      (cardSelecionado.labels || []).forEach(label => {
        if (label.name && label.name.trim()) {
          novosLabelsGlobais[label.color] = label.name;
        }
      });
      setLabelsGlobais(novosLabelsGlobais);
      
      setModalLabelAberto(true);
    }
  };

  const adicionarLabelEditavel = (color) => {
    const labelExiste = labelsEditando.find(l => l.color === color);
    if (labelExiste) {
      setLabelsEditando(labelsEditando.filter(l => l.color !== color));
    } else {
      setLabelsEditando([...labelsEditando, { color, name: '' }]);
    }
  };

  const atualizarNomeLabel = (index, nome) => {
    const novasLabels = [...labelsEditando];
    novasLabels[index].name = nome;
    setLabelsEditando(novasLabels);
  };

  const salvarLabels = async (labelsParaSalvar = null) => {
    if (!cardSelecionado) return;
    
    const labels = labelsParaSalvar || labelsEditando;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/labels`,
        { labels },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Atualizar card selecionado
      const responseCard = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(responseCard.data);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao atualizar etiquetas');
    }
  };

  // ========== DESCRIÇÃO EDITÁVEL ==========
  const iniciarEdicaoDescricao = () => {
    setDescricaoTemp(cardSelecionado?.descricao || '');
    setEditandoDescricao(true);
  };

  const salvarDescricao = async () => {
    if (!cardSelecionado) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/descricao`,
        { descricao: descricaoTemp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Descrição atualizada!');
      setEditandoDescricao(false);
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao atualizar descrição');
    }
  };

  // ========== SUB-TAREFAS ==========
  const adicionarSubtarefa = async (itemId) => {
    if (!textoSubtarefa.trim() || !cardSelecionado) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist/${itemId}/subtarefa`,
        { texto: textoSubtarefa.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTextoSubtarefa('');
      setAdicionandoSubtarefa(null);
      toast.success('Sub-tarefa adicionada!');
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao adicionar sub-tarefa');
    }
  };

  const toggleSubtarefa = async (itemId, subtarefaId, concluido) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist/${itemId}/subtarefa/${subtarefaId}`,
        { concluido: !concluido },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      console.error('Erro ao atualizar sub-tarefa');
    }
  };

  const calcularProgressoItem = (item) => {
    if (!item.subtarefas || item.subtarefas.length === 0) return 0;
    const concluidas = item.subtarefas.filter(s => s.concluido).length;
    return Math.round((concluidas / item.subtarefas.length) * 100);
  };

  // ========== ATRIBUIR MEMBROS AO CHECKLIST ==========
  const atribuirMembroChecklist = async (itemId, username) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist/${itemId}/assignee`,
        { assignee: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAtribuindoMembroItem(null);
      toast.success('Membro atribuído!');
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao atribuir membro');
    }
  };

  const removerMembroChecklist = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist/${itemId}/assignee`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Membro removido!');
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao remover membro');
    }
  };

  // ========== ATRIBUIR MEMBROS A ETIQUETAS ==========
  const atribuirMembroLabel = async (labelColor, username) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/labels/${labelColor}/assignee`,
        { assignee: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAtribuindoMembroLabel(null);
      toast.success('Membro atribuído à etiqueta!');
      
      // Recarregar cards e card selecionado
      carregarDados();
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao atribuir membro');
    }
  };

  const removerMembroLabel = async (labelColor) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/labels/${labelColor}/assignee`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Membro removido da etiqueta!');
      
      // Recarregar cards e card selecionado
      carregarDados();
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao remover membro');
    }
  };

  // ========== ATRIBUIR MEMBROS A QUESTÕES ==========
  const atribuirMembroQuestao = async (questaoId, username) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/questoes/${questaoId}/assignee`,
        { assignee: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAtribuindoMembroQuestao(null);
      toast.success('Membro atribuído!');
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao atribuir membro');
    }
  };

  const removerMembroQuestao = async (questaoId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/questoes/${questaoId}/assignee`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Membro removido!');
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao remover membro');
    }
  };

  // ========== SUB-SUBTAREFAS (ANINHADAS) ==========
  const adicionarSubSubtarefa = async (itemId, subtarefaId) => {
    if (!textoSubSubtarefa.trim() || !cardSelecionado) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist/${itemId}/subtarefa/${subtarefaId}/subsubtarefa`,
        { texto: textoSubSubtarefa.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTextoSubSubtarefa('');
      setAdicionandoSubSubtarefa(null);
      toast.success('Sub-sub-tarefa adicionada!');
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao adicionar sub-sub-tarefa');
    }
  };

  const toggleSubSubtarefa = async (itemId, subtarefaId, subSubtarefaId, concluido) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist/${itemId}/subtarefa/${subtarefaId}/subsubtarefa/${subSubtarefaId}`,
        { concluido: !concluido },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      console.error('Erro ao atualizar sub-sub-tarefa');
    }
  };

  // ========== CAPA ==========
  const abrirModalCapa = () => {
    setCapaUrl(cardSelecionado?.capa_url || '');
    setCapaCor(cardSelecionado?.capa_cor || '');
    setTipoCapaSelecionado(cardSelecionado?.capa_url ? 'imagem' : 'cor');
    setModalCapaAberto(true);
  };

  const salvarCapa = async () => {
    if (!cardSelecionado) return;
    
    try {
      const token = localStorage.getItem('token');
      const dados = {};
      
      if (tipoCapaSelecionado === 'imagem' && capaUrl.trim()) {
        dados.capa_url = capaUrl.trim();
        dados.capa_cor = null;
      } else if (tipoCapaSelecionado === 'cor' && capaCor) {
        dados.capa_cor = capaCor;
        dados.capa_url = null;
      }
      
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/capa`,
        dados,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Capa atualizada!');
      setModalCapaAberto(false);
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao atualizar capa');
    }
  };

  const removerCapa = async () => {
    if (!cardSelecionado) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/capa`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Capa removida!');
      setModalCapaAberto(false);
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao remover capa');
    }
  };

  // ========== DATA DE VENCIMENTO ==========
  const abrirModalData = () => {
    if (cardSelecionado?.data_vencimento) {
      const dataAtual = new Date(cardSelecionado.data_vencimento);
      const dataISO = dataAtual.toISOString().split('T')[0];
      const hora = dataAtual.toTimeString().slice(0, 5);
      setDataVencimento(dataISO);
      setHoraVencimento(hora);
    } else {
      setDataVencimento('');
      setHoraVencimento('12:00');
    }
    setModalDataAberto(true);
  };

  const salvarData = async () => {
    if (!cardSelecionado) return;
    
    try {
      const token = localStorage.getItem('token');
      let dataCompleta = null;
      
      if (dataVencimento) {
        dataCompleta = `${dataVencimento}T${horaVencimento}:00`;
      }
      
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`,
        { data_vencimento: dataCompleta },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Data atualizada!');
      setModalDataAberto(false);
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao atualizar data');
    }
  };

  const removerData = async () => {
    if (!cardSelecionado) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`,
        { data_vencimento: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Data removida!');
      setModalDataAberto(false);
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao remover data');
    }
  };

  const salvarCard = async () => {
    if (!formCard.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (cardEditando) {
        await axios.put(`${BACKEND_URL}/api/kanban/cards/${cardEditando.id}`, formCard, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Card atualizado!');
      } else {
        await axios.post(`${BACKEND_URL}/api/kanban/cards`, { ...formCard, coluna_id: colunaIdParaNovoCard }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Card criado!');
      }
      setModalCardAberto(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao salvar card');
    }
  };

  const deletarCard = async (cardId) => {
    if (!window.confirm('Tem certeza que deseja deletar este card?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/kanban/cards/${cardId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Card deletado!');
      setCardDetalheAberto(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao deletar card');
    }
  };

  const abrirDetalheCard = async (card) => {
    setCardSelecionado(card);
    setCardDetalheAberto(true);
    await carregarMembros();
  };

  const carregarMembros = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembrosDisponiveis(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  };

  const cadastrarNovoMembro = async () => {
    if (!novoMembroForm.username.trim()) {
      toast.error('Username é obrigatório');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/auth/register`,
        {
          username: novoMembroForm.username.trim(),
          nome: novoMembroForm.nome.trim() || novoMembroForm.username.trim(),
          password: novoMembroForm.password || '123',
          role: 'production'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Membro cadastrado!');
      setModalCadastroMembroAberto(false);
      setNovoMembroForm({ username: '', nome: '', password: '123' });
      await carregarMembros();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar membro');
    }
  };

  const adicionarLabel = (color) => {
    const labelExiste = formCard.labels.some(l => l.color === color);
    if (labelExiste) {
      setFormCard({ ...formCard, labels: formCard.labels.filter(l => l.color !== color) });
    } else {
      setFormCard({ ...formCard, labels: [...formCard.labels, { color, name: '' }] });
    }
  };

  const adicionarItemChecklist = async () => {
    if (!novoItemChecklist.trim() || !cardSelecionado) return;
    try {
      const token = localStorage.getItem('token');
      const payload = { 
        texto: novoItemChecklist.trim(),
        assignee: membroNovoItem || undefined
      };
      await axios.post(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setNovoItemChecklist('');
      setMembroNovoItem('');
      setMostrarSeletorMembroNovoItem(false);
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
      toast.success('Item adicionado!');
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  // Funções para "A Resolver"
  const adicionarQuestao = async () => {
    if (!novaQuestao.trim() || !cardSelecionado) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/questoes`,
        { pergunta: novaQuestao.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNovaQuestao('');
      carregarDados();
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
    } catch (error) {
      console.error('Erro ao adicionar questão:', error);
    }
  };

  const adicionarResposta = async (questaoId) => {
    if (!novaResposta.trim() || !cardSelecionado) return;
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/questoes/${questaoId}/respostas`,
        { 
          texto: novaResposta.trim(),
          autor: user?.username || 'Anônimo'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNovaResposta('');
      setQuestaoExpandida(null);
      carregarDados();
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
    } catch (error) {
      console.error('Erro ao adicionar resposta:', error);
    }
  };

  const marcarQuestaoResolvida = async (questaoId, resolvida) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/questoes/${questaoId}`,
        { resolvida: !resolvida },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      carregarDados();
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
    } catch (error) {
      console.error('Erro ao marcar questão:', error);
    }
  };

  const deletarResposta = async (questaoId, respostaId) => {
    if (!window.confirm('Deseja realmente deletar esta resposta?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/questoes/${questaoId}/respostas/${respostaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      carregarDados();
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
      toast.success('Resposta deletada');
    } catch (error) {
      console.error('Erro ao deletar resposta:', error);
      toast.error('Erro ao deletar resposta');
    }
  };

  const toggleItemChecklist = async (itemId, concluido) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist/${itemId}`, { concluido: !concluido }, { headers: { Authorization: `Bearer ${token}` } });
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
    } catch (error) {
      console.error('Erro ao atualizar item');
    }
  };

  const adicionarComentario = async () => {
    if (!novoComentario.trim() || !cardSelecionado) return;
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const autor = user.nome || user.username || 'Usuário';
      await axios.post(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/comentario`, { autor, texto: novoComentario.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setNovoComentario('');
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const adicionarAnexo = async () => {
    if (!cardSelecionado) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (tipoAnexo === 'upload') {
        // Upload de arquivo
        if (!arquivoUpload) {
          toast.error('Selecione um arquivo');
          return;
        }
        
        const formData = new FormData();
        formData.append('file', arquivoUpload);
        
        await axios.post(
          `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/anexo/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        setArquivoUpload(null);
      } else {
        // Link
        if (!novoAnexo.nome.trim() || !novoAnexo.url.trim()) {
          toast.error('Preencha nome e URL');
          return;
        }
        
        await axios.post(
          `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/anexo`,
          novoAnexo,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      setNovoAnexo({ nome: '', url: '', tipo: 'link' });
      setModalAnexoAberto(false);
      toast.success('Anexo adicionado!');
      
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao adicionar anexo');
    }
  };

  const removerAnexo = async (anexoId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/anexo/${anexoId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Anexo removido!');
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao remover anexo');
    }
  };

  const adicionarMembro = async () => {
    if (!novoMembro.trim() || !cardSelecionado) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/membro`, { username: novoMembro.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setNovoMembro('');
      toast.success('Membro adicionado!');
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao adicionar membro');
    }
  };

  const removerMembro = async (usuarioId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/membro/${usuarioId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Membro removido!');
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao remover membro');
    }
  };

  const copiarCard = async () => {
    if (!cardSelecionado) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/copiar`, { coluna_destino_id: colunaSelecionadaMover || cardSelecionado.coluna_id }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Card copiado!');
      setModalCopiarAberto(false);
      setCardDetalheAberto(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao copiar card');
    }
  };

  const moverCard = async () => {
    if (!cardSelecionado || !colunaSelecionadaMover) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/kanban/cards/mover`, { card_id: cardSelecionado.id, coluna_destino_id: colunaSelecionadaMover, nova_posicao: 0 }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Card movido!');
      setModalMoverAberto(false);
      setCardDetalheAberto(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao mover card');
    }
  };

  const arquivarCard = async () => {
    if (!cardSelecionado) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/arquivar`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Card arquivado!');
      setCardDetalheAberto(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao arquivar card');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const fundoAtual = fundos.find(f => f.id === fundoSelecionado) || fundos[0];

  return (
    <div className={`h-screen flex flex-col ${fundoAtual.classe}`}>
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md shadow-lg border-b-2 border-gray-200 px-6 py-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Líder Flow
            </h1>
            <p className="text-gray-600 text-sm mt-1 font-medium">Organize suas tarefas com drag and drop • Visualize prazos com barras de combustível</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setModalFundoAberto(true)} 
              className="bg-white text-gray-700 border-2 border-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:shadow-md flex items-center gap-2 font-semibold transition-all"
            >
              <span 
                className="w-6 h-6 rounded-lg border-2 border-gray-400 shadow-sm" 
                style={{ 
                  background: fundoAtual.id.startsWith('gradient') 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : fundoAtual.id.startsWith('solid') 
                    ? fundoAtual.classe.replace('bg-', '') 
                    : 'url(...)' 
                }}
              ></span>
              Plano de Fundo
            </button>
            <button 
              onClick={() => abrirModalColuna()} 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Nova Coluna
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="column">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-4 h-full" style={{ minWidth: 'min-content' }}>
                {colunas.map((coluna, index) => (
                  <Draggable key={coluna.id} draggableId={coluna.id} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps} 
                        className={`flex-shrink-0 w-80 rounded-xl shadow-lg flex flex-col backdrop-blur-sm border-2 transition-all duration-200 ${
                          snapshot.isDragging 
                            ? 'opacity-60 rotate-2 scale-105 shadow-2xl' 
                            : 'hover:shadow-xl'
                        }`} 
                        style={{ 
                          maxHeight: 'calc(100vh - 180px)', 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          borderColor: coluna.cor || '#E5E7EB',
                          ...provided.draggableProps.style 
                        }}
                      >
                        <div 
                          {...provided.dragHandleProps} 
                          className="px-4 py-3 cursor-move flex justify-between items-center rounded-t-xl border-b-2"
                          style={{ 
                            borderBottomColor: coluna.cor || '#E5E7EB',
                            backgroundColor: coluna.cor ? `${coluna.cor}15` : '#F9FAFB'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {coluna.cor && (
                              <div 
                                className="w-3 h-3 rounded-full shadow-sm" 
                                style={{ backgroundColor: coluna.cor }}
                              />
                            )}
                            <h3 className="font-bold text-gray-900 text-base">{coluna.titulo}</h3>
                            <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              {(cards[coluna.id] || []).length}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => abrirModalColuna(coluna)} 
                              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button 
                              onClick={() => deletarColuna(coluna.id)} 
                              className="p-1.5 hover:bg-red-50 hover:shadow-sm rounded-md transition-all"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>

                        {/* Adicionar Card - TOPO */}
                        <div className="p-3 border-b-2" style={{ borderColor: coluna.cor ? `${coluna.cor}30` : '#E5E7EB' }}>
                          {adicionandoCardColuna === coluna.id ? (
                            <div className="space-y-2">
                              <textarea
                                autoFocus
                                value={textoNovoCard}
                                onChange={(e) => setTextoNovoCard(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    criarCardRapido(coluna.id);
                                  }
                                }}
                                placeholder="Inserir um título para este cartão..."
                                className="w-full border-2 border-indigo-300 rounded-lg px-3 py-2 text-sm resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                rows="3"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => criarCardRapido(coluna.id)}
                                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg text-sm font-semibold transition-all"
                                >
                                  Adicionar cartão
                                </button>
                                <button
                                  onClick={() => {
                                    setAdicionandoCardColuna(null);
                                    setTextoNovoCard('');
                                  }}
                                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAdicionandoCardColuna(coluna.id)}
                              className="w-full text-left text-sm text-gray-700 hover:bg-white hover:shadow-md px-3 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all border-2 border-dashed border-gray-300 hover:border-indigo-400"
                            >
                              <Plus className="w-4 h-4" />
                              Adicionar um cartão
                            </button>
                          )}
                        </div>

                        <Droppable droppableId={coluna.id} type="card">
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.droppableProps} 
                              className={`flex-1 overflow-y-auto p-3 space-y-3 transition-all duration-200 ${
                                snapshot.isDraggingOver 
                                  ? 'bg-indigo-50 ring-2 ring-indigo-300 ring-inset' 
                                  : ''
                              }`}
                            >
                              {(cards[coluna.id] || []).map((card, cardIndex) => (
                                <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                                  {(provided, snapshot) => {
                                    const combustivel = calcularCombustivel(card.data_vencimento);
                                    
                                    return (
                                      <div 
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps} 
                                        onClick={() => abrirDetalheCard(card)} 
                                        className={`bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.25)] border-[3px] border-gray-300 cursor-pointer hover:border-indigo-400 transition-all duration-300 overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02] ${snapshot.isDragging ? 'opacity-70 rotate-3 shadow-[0_30px_80px_rgb(0,0,0,0.35)] scale-105 ring-4 ring-indigo-300' : ''}`}
                                        style={{ 
                                          backdropFilter: 'blur(10px)',
                                          background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)'
                                        }}
                                      >
                                        {/* Capa do Card */}
                                        {(card.capa_url || card.capa_cor) && (
                                          <div className="w-full h-32 -mt-0 -mx-0">
                                            {card.capa_url ? (
                                              <img src={card.capa_url} alt="Capa" className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full" style={{ backgroundColor: card.capa_cor }} />
                                            )}
                                          </div>
                                        )}
                                        
                                        <div className="p-3">
                                          {/* Labels com Membros (Processo de Aprovação) */}
                                          {card.labels && card.labels.length > 0 && (
                                            <div className="flex gap-2 mb-2 flex-wrap">
                                              {card.labels.map((label, i) => (
                                                label.name ? (
                                                  <div 
                                                    key={i}
                                                    className="relative group"
                                                  >
                                                    <div 
                                                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-md border-2 border-white/30 hover:scale-105 transition-transform cursor-pointer" 
                                                      style={{ backgroundColor: LABEL_COLORS.find(l => l.value === label.color)?.hex }}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAtribuindoMembroLabel(atribuindoMembroLabel === label.color ? null : label.color);
                                                      }}
                                                    >
                                                      <span>{label.name}</span>
                                                      {label.assignee ? (
                                                        <>
                                                          <MemberAvatar username={label.assignee} size="xs" />
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              removerMembroLabel(label.color);
                                                            }}
                                                            className="ml-0.5 hover:bg-white/20 rounded-full p-0.5"
                                                            title="Remover responsável"
                                                          >
                                                            <X className="w-2.5 h-2.5" />
                                                          </button>
                                                        </>
                                                      ) : (
                                                        <User className="w-3 h-3 opacity-70" />
                                                      )}
                                                    </div>
                                                    
                                                    {/* Dropdown de Membros para Label */}
                                                    {atribuindoMembroLabel === label.color && (
                                                      <div 
                                                        className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-2 z-50 w-52"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
                                                          Responsável por: {label.name}
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto">
                                                          {membrosDisponiveis.length > 0 ? (
                                                            membrosDisponiveis.map((membro) => (
                                                              <button
                                                                key={membro.id}
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  atribuirMembroLabel(label.color, membro.username);
                                                                }}
                                                                className="w-full text-left px-2 py-2 hover:bg-indigo-50 rounded flex items-center gap-2 transition-colors"
                                                              >
                                                                <MemberAvatar username={membro.username} size="sm" />
                                                                <div className="flex-1">
                                                                  <div className="text-sm font-medium text-gray-900">{membro.username}</div>
                                                                  {membro.nome && (
                                                                    <div className="text-xs text-gray-600">{membro.nome}</div>
                                                                  )}
                                                                </div>
                                                              </button>
                                                            ))
                                                          ) : (
                                                            <p className="text-xs text-gray-500 px-2 py-2">Nenhum membro disponível</p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div key={i} className="h-2 w-10 rounded-full shadow-sm" style={{ backgroundColor: LABEL_COLORS.find(l => l.value === label.color)?.hex }} />
                                                )
                                              ))}
                                            </div>
                                          )}
                                          
                                          {/* Título */}
                                          <h4 className="text-sm font-semibold text-gray-900 mb-3 leading-snug">{card.titulo}</h4>
                                          
                                          {/* Barra de Combustível - NOVO */}
                                          {card.data_vencimento && (
                                            <div className="mb-3">
                                              <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1.5">
                                                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                                                  <span className="text-xs font-medium text-gray-600">Prazo</span>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${combustivel.badge}`}>
                                                  {combustivel.texto}
                                                </span>
                                              </div>
                                              {/* Barra de Combustível */}
                                              <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                                <div 
                                                  className={`h-full ${combustivel.cor} transition-all duration-500 ease-out rounded-full relative`}
                                                  style={{ width: `${combustivel.nivel}%` }}
                                                >
                                                  {/* Brilho na barra */}
                                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Membros com Avatares */}
                                          {card.assignees && card.assignees.length > 0 && (
                                            <div className="mb-2 flex items-center gap-1">
                                              <div className="flex -space-x-2">
                                                {card.assignees.slice(0, 3).map((assignee, idx) => {
                                                  // assignee pode ser string ou objeto
                                                  const username = typeof assignee === 'string' ? assignee : (assignee?.username || assignee);
                                                  return <MemberAvatar key={idx} username={username} size="sm" />;
                                                })}
                                                {card.assignees.length > 3 && (
                                                  <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700 ring-2 ring-white shadow-md">
                                                    +{card.assignees.length - 3}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Ícones de Informação */}
                                          <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                                            {card.checklist && card.checklist.length > 0 && (
                                              <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                                                card.checklist.filter(i => i.concluido).length === card.checklist.length 
                                                  ? 'bg-green-100 text-green-700' 
                                                  : 'bg-gray-100'
                                              }`}>
                                                <CheckSquare className="w-3.5 h-3.5" />
                                                <span className="font-medium">{card.checklist.filter(i => i.concluido).length}/{card.checklist.length}</span>
                                              </div>
                                            )}
                                            {card.anexos && card.anexos.length > 0 && (
                                              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                                <Paperclip className="w-3.5 h-3.5" />
                                                <span className="font-medium">{card.anexos.length}</span>
                                              </div>
                                            )}
                                            {card.comentarios && card.comentarios.length > 0 && (
                                              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span className="font-medium">{card.comentarios.length}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Modal Coluna */}
      {modalColunaAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{colunaEditando ? 'Editar Coluna' : 'Nova Coluna'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" value={formColuna.titulo} onChange={(e) => setFormColuna({ ...formColuna, titulo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Ex: Segunda, A Fazer, Em Progresso..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor (opcional)</label>
                <div className="flex gap-2 flex-wrap">
                  {LABEL_COLORS.map((color) => (
                    <button key={color.value} onClick={() => setFormColuna({ ...formColuna, cor: color.hex })} className={`w-10 h-10 rounded-lg ${formColuna.cor === color.hex ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: color.hex }} />
                  ))}
                  <button onClick={() => setFormColuna({ ...formColuna, cor: null })} className={`w-10 h-10 rounded-lg border-2 border-gray-300 ${!formColuna.cor ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}>
                    <X className="w-4 h-4 mx-auto text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalColunaAberto(false)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={salvarColuna} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">{colunaEditando ? 'Atualizar' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Card Rápido */}
      {modalCardAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{cardEditando ? 'Editar Card' : 'Novo Card'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" value={formCard.titulo} onChange={(e) => setFormCard({ ...formCard, titulo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Ex: Pagar Marlon, Tirar Carro..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={formCard.descricao} onChange={(e) => setFormCard({ ...formCard, descricao: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows="3" placeholder="Detalhes adicionais..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
                <div className="flex gap-2 flex-wrap">
                  {LABEL_COLORS.map((color) => (
                    <button key={color.value} onClick={() => adicionarLabel(color.value)} className={`px-4 py-2 rounded-lg text-white text-sm ${formCard.labels.some(l => l.color === color.value) ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: color.hex }}>{color.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalCardAberto(false)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={salvarCard} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">{cardEditando ? 'Atualizar' : 'Criar Card'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes Completo do Card */}
      {cardDetalheAberto && cardSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8 flex" style={{ maxHeight: '90vh' }}>
            {/* Conteúdo Principal */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{cardSelecionado.titulo}</h2>
                  {cardSelecionado.labels && cardSelecionado.labels.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {cardSelecionado.labels.map((label, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-white text-xs font-medium" style={{ backgroundColor: LABEL_COLORS.find(l => l.value === label.color)?.hex }}>
                          {label.name || LABEL_COLORS.find(l => l.value === label.color)?.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setCardDetalheAberto(false)} className="text-gray-500 hover:text-gray-700 ml-4">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Abas */}
              <div className="flex border-b mb-4">
                <button onClick={() => setAbaAtiva('detalhes')} className={`px-4 py-2 font-medium ${abaAtiva === 'detalhes' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}>Detalhes</button>
                <button onClick={() => setAbaAtiva('atividades')} className={`px-4 py-2 font-medium ${abaAtiva === 'atividades' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}>
                  Atividades {cardSelecionado.atividades && cardSelecionado.atividades.length > 0 && `(${cardSelecionado.atividades.length})`}
                </button>
              </div>

              {/* Conteúdo das Abas */}
              {abaAtiva === 'detalhes' && (
                <div className="space-y-6">
                  {/* Data de Vencimento */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Data de Vencimento
                    </h3>
                    {cardSelecionado.data_vencimento ? (
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(cardSelecionado.data_vencimento).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <button 
                          onClick={abrirModalData}
                          className="text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          Editar
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-3">Nenhuma data definida</p>
                    )}
                    {!cardSelecionado.data_vencimento && (
                      <button 
                        onClick={abrirModalData}
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar data
                      </button>
                    )}
                  </div>

                  {/* Descrição Editável */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold text-gray-700">Descrição</h3>
                      {!editandoDescricao && (
                        <button onClick={iniciarEdicaoDescricao} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </button>
                      )}
                    </div>
                    {editandoDescricao ? (
                      <div className="space-y-2">
                        <textarea
                          autoFocus
                          value={descricaoTemp}
                          onChange={(e) => setDescricaoTemp(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          rows="4"
                          placeholder="Adicione uma descrição mais detalhada..."
                        />
                        <div className="flex gap-2">
                          <button onClick={salvarDescricao} className="bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 text-sm">
                            Salvar
                          </button>
                          <button onClick={() => setEditandoDescricao(false)} className="text-gray-600 hover:text-gray-900 px-4 py-1.5 text-sm">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {cardSelecionado.descricao ? (
                          <p className="text-gray-900 whitespace-pre-wrap text-sm">{cardSelecionado.descricao}</p>
                        ) : (
                          <p className="text-gray-500 text-sm italic">Clique em "Editar" para adicionar uma descrição...</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Anexos */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Anexos
                    </h3>
                    {cardSelecionado.anexos && cardSelecionado.anexos.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {cardSelecionado.anexos.map((anexo) => (
                          <div key={anexo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Paperclip className="w-4 h-4 text-gray-600" />
                              <div>
                                <a href={anexo.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">{anexo.nome}</a>
                                <p className="text-xs text-gray-500">Adicionado em {new Date(anexo.data).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                            <button onClick={() => removerAnexo(anexo.id)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-3">Nenhum anexo</p>
                    )}
                    <button onClick={() => setModalAnexoAberto(true)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-sm">Adicionar Anexo</button>
                  </div>

                  {/* Checklist com Sub-tarefas */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      Checklist
                    </h3>
                    {cardSelecionado.checklist && cardSelecionado.checklist.length > 0 ? (
                      <div className="space-y-3 mb-3">
                        {cardSelecionado.checklist.map((item) => {
                          const progresso = calcularProgressoItem(item);
                          const subtarefas = item.subtarefas || [];
                          const totalSubtarefas = subtarefas.length;
                          const subtarefasConcluidas = subtarefas.filter(s => s.concluido).length;

                          return (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                              {/* Item Principal */}
                              <div className="flex items-start gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={item.concluido} 
                                  onChange={() => toggleItemChecklist(item.id, item.concluido)} 
                                  className="w-4 h-4 mt-0.5" 
                                />
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className={`${item.concluido ? 'line-through text-gray-500' : 'text-gray-900'} font-medium flex-1`}>
                                      {item.texto}
                                    </span>
                                    
                                    {/* Atribuir Membro */}
                                    <div className="relative flex items-center gap-1">
                                      {item.assignee ? (
                                        <div className="flex items-center gap-1">
                                          <MemberAvatar username={item.assignee} size="xs" />
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removerMembroChecklist(item.id);
                                            }}
                                            className="p-0.5 hover:bg-gray-200 rounded"
                                            title="Remover membro"
                                          >
                                            <X className="w-3 h-3 text-gray-600" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAtribuindoMembroItem(atribuindoMembroItem === item.id ? null : item.id);
                                          }}
                                          className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900"
                                          title="Atribuir membro"
                                        >
                                          <User className="w-4 h-4" />
                                        </button>
                                      )}
                                      
                                      {/* Dropdown de Membros */}
                                      {atribuindoMembroItem === item.id && (
                                        <div 
                                          className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border-2 border-gray-200 p-2 z-50 w-48"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Atribuir a:</div>
                                          <div className="max-h-48 overflow-y-auto">
                                            {membrosDisponiveis.length > 0 ? (
                                              membrosDisponiveis.map((membro) => (
                                                <button
                                                  key={membro.id}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    atribuirMembroChecklist(item.id, membro.username);
                                                  }}
                                                  className="w-full text-left px-2 py-1.5 hover:bg-indigo-50 rounded flex items-center gap-2"
                                                >
                                                  <MemberAvatar username={membro.username} size="xs" />
                                                  <span className="text-sm text-gray-900">{membro.username}</span>
                                                </button>
                                              ))
                                            ) : (
                                              <p className="text-xs text-gray-500 px-2 py-1">Nenhum membro disponível</p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Barra de Progresso das Sub-tarefas */}
                                  {totalSubtarefas > 0 && (
                                    <div className="mt-2">
                                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>{subtarefasConcluidas}/{totalSubtarefas} sub-tarefas concluídas</span>
                                        <span>{progresso}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                                          style={{ width: `${progresso}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Sub-tarefas */}
                                  {totalSubtarefas > 0 && (
                                    <div className="mt-3 ml-4 space-y-3">
                                      {subtarefas.map((subtarefa) => {
                                        const subSubtarefas = subtarefa.subsubtarefas || [];
                                        const totalSubSub = subSubtarefas.length;
                                        const subSubConcluidas = subSubtarefas.filter(s => s.concluido).length;
                                        
                                        return (
                                          <div key={subtarefa.id} className="border-l-2 border-gray-300 pl-3">
                                            <div className="flex items-start gap-2">
                                              <input 
                                                type="checkbox" 
                                                checked={subtarefa.concluido} 
                                                onChange={() => toggleSubtarefa(item.id, subtarefa.id, subtarefa.concluido)} 
                                                className="w-3 h-3 mt-0.5" 
                                              />
                                              <div className="flex-1">
                                                <span className={`text-sm ${subtarefa.concluido ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                                  {subtarefa.texto}
                                                </span>
                                                
                                                {/* Sub-Sub-tarefas (Aninhadas) */}
                                                {totalSubSub > 0 && (
                                                  <div className="mt-2 ml-4 space-y-1.5">
                                                    {subSubtarefas.map((subSub) => (
                                                      <div key={subSub.id} className="flex items-center gap-2">
                                                        <input 
                                                          type="checkbox" 
                                                          checked={subSub.concluido} 
                                                          onChange={() => toggleSubSubtarefa(item.id, subtarefa.id, subSub.id, subSub.concluido)} 
                                                          className="w-2.5 h-2.5" 
                                                        />
                                                        <span className={`text-xs ${subSub.concluido ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                                          {subSub.texto}
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}

                                                {/* Adicionar Sub-Sub-tarefa */}
                                                {adicionandoSubSubtarefa === subtarefa.id ? (
                                                  <div className="mt-2 ml-4 flex gap-1">
                                                    <input
                                                      autoFocus
                                                      type="text"
                                                      value={textoSubSubtarefa}
                                                      onChange={(e) => setTextoSubSubtarefa(e.target.value)}
                                                      onKeyPress={(e) => e.key === 'Enter' && adicionarSubSubtarefa(item.id, subtarefa.id)}
                                                      placeholder="Sub-sub-tarefa..."
                                                      className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs"
                                                    />
                                                    <button
                                                      onClick={() => adicionarSubSubtarefa(item.id, subtarefa.id)}
                                                      className="bg-indigo-600 text-white px-2 py-0.5 rounded hover:bg-indigo-700 text-xs"
                                                    >
                                                      +
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        setAdicionandoSubSubtarefa(null);
                                                        setTextoSubSubtarefa('');
                                                      }}
                                                      className="text-gray-600 hover:text-gray-900"
                                                    >
                                                      <X className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <button
                                                    onClick={() => setAdicionandoSubSubtarefa(subtarefa.id)}
                                                    className="mt-1 ml-4 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                                  >
                                                    <Plus className="w-3 h-3" />
                                                    Adicionar sub-sub-tarefa
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Adicionar Sub-tarefa */}
                                  {adicionandoSubtarefa === item.id ? (
                                    <div className="mt-2 ml-4 flex gap-2">
                                      <input
                                        autoFocus
                                        type="text"
                                        value={textoSubtarefa}
                                        onChange={(e) => setTextoSubtarefa(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && adicionarSubtarefa(item.id)}
                                        placeholder="Nova sub-tarefa..."
                                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                      />
                                      <button
                                        onClick={() => adicionarSubtarefa(item.id)}
                                        className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-xs"
                                      >
                                        Add
                                      </button>
                                      <button
                                        onClick={() => {
                                          setAdicionandoSubtarefa(null);
                                          setTextoSubtarefa('');
                                        }}
                                        className="text-gray-600 hover:text-gray-900"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setAdicionandoSubtarefa(item.id)}
                                      className="mt-2 ml-4 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Adicionar sub-tarefa
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-3">Nenhum item no checklist</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={novoItemChecklist} 
                          onChange={(e) => setNovoItemChecklist(e.target.value)} 
                          onKeyPress={(e) => e.key === 'Enter' && !mostrarSeletorMembroNovoItem && adicionarItemChecklist()} 
                          placeholder="Adicionar item..." 
                          className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                        />
                        <button 
                          onClick={() => setMostrarSeletorMembroNovoItem(!mostrarSeletorMembroNovoItem)}
                          className={`p-2 rounded-lg border-2 transition-colors ${
                            membroNovoItem 
                              ? 'border-indigo-500 bg-indigo-50' 
                              : 'border-gray-300 hover:border-indigo-300'
                          }`}
                          title="Atribuir membro"
                        >
                          {membroNovoItem ? (
                            <MemberAvatar username={membroNovoItem} size="xs" />
                          ) : (
                            <User className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <button 
                          onClick={adicionarItemChecklist} 
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-md hover:shadow-lg transition-all"
                          disabled={!novoItemChecklist.trim()}
                        >
                          Adicionar
                        </button>
                      </div>
                      
                      {/* Dropdown de Seleção de Membro */}
                      {mostrarSeletorMembroNovoItem && (
                        <div className="bg-gray-50 border-2 border-indigo-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">Atribuir a:</span>
                            {membroNovoItem && (
                              <button
                                onClick={() => setMembroNovoItem('')}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {membrosDisponiveis.length > 0 ? (
                              membrosDisponiveis.map((membro) => (
                                <button
                                  key={membro.id}
                                  onClick={() => {
                                    setMembroNovoItem(membro.username);
                                    setMostrarSeletorMembroNovoItem(false);
                                  }}
                                  className={`p-2 rounded-lg text-left flex items-center gap-2 transition-all ${
                                    membroNovoItem === membro.username
                                      ? 'bg-indigo-100 border-2 border-indigo-400'
                                      : 'bg-white border-2 border-gray-200 hover:border-indigo-300'
                                  }`}
                                >
                                  <MemberAvatar username={membro.username} size="xs" />
                                  <span className="text-xs font-medium text-gray-900 truncate">{membro.username}</span>
                                </button>
                              ))
                            ) : (
                              <p className="text-xs text-gray-500 col-span-2 text-center py-2">Nenhum membro disponível</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* A Resolver */}
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      A Resolver
                      <span className="text-xs font-normal text-gray-500">(Perguntas e Decisões)</span>
                    </h3>
                    {cardSelecionado.questoes_resolver && cardSelecionado.questoes_resolver.length > 0 ? (
                      <div className="space-y-3 mb-3">
                        {cardSelecionado.questoes_resolver.map((questao) => (
                          <div 
                            key={questao.id} 
                            className={`border-2 rounded-lg p-4 transition-all ${
                              questao.resolvida 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-orange-300 bg-orange-50'
                            }`}
                          >
                            {/* Questão Principal */}
                            <div className="flex items-start gap-3 mb-3">
                              <input 
                                type="checkbox" 
                                checked={questao.resolvida} 
                                onChange={() => marcarQuestaoResolvida(questao.id, questao.resolvida)} 
                                className="w-5 h-5 mt-0.5" 
                              />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`font-medium flex-1 ${questao.resolvida ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                                    {questao.pergunta}
                                  </p>
                                  
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Membro Atribuído */}
                                    <div className="relative">
                                      {questao.assignee ? (
                                        <div className="flex items-center gap-1">
                                          <MemberAvatar username={questao.assignee} size="xs" />
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removerMembroQuestao(questao.id);
                                            }}
                                            className="p-0.5 hover:bg-orange-200 rounded"
                                            title="Remover responsável"
                                          >
                                            <X className="w-3 h-3 text-gray-600" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAtribuindoMembroQuestao(atribuindoMembroQuestao === questao.id ? null : questao.id);
                                          }}
                                          className="p-1 hover:bg-orange-200 rounded text-gray-600 hover:text-gray-900"
                                          title="Atribuir responsável"
                                        >
                                          <User className="w-4 h-4" />
                                        </button>
                                      )}
                                      
                                      {/* Dropdown de Membros */}
                                      {atribuindoMembroQuestao === questao.id && (
                                        <div 
                                          className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border-2 border-gray-200 p-2 z-50 w-48"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Atribuir a:</div>
                                          <div className="max-h-48 overflow-y-auto">
                                            {membrosDisponiveis.length > 0 ? (
                                              membrosDisponiveis.map((membro) => (
                                                <button
                                                  key={membro.id}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    atribuirMembroQuestao(questao.id, membro.username);
                                                  }}
                                                  className="w-full text-left px-2 py-1.5 hover:bg-orange-50 rounded flex items-center gap-2"
                                                >
                                                  <MemberAvatar username={membro.username} size="xs" />
                                                  <span className="text-sm text-gray-900">{membro.username}</span>
                                                </button>
                                              ))
                                            ) : (
                                              <p className="text-xs text-gray-500 px-2 py-1">Nenhum membro disponível</p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                      questao.resolvida 
                                        ? 'bg-green-200 text-green-800' 
                                        : 'bg-orange-200 text-orange-800'
                                    }`}>
                                      {questao.resolvida ? 'Resolvido' : 'Pendente'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1">
                                  {questao.criado_em && (
                                    <p className="text-xs text-gray-500">
                                      Criado em {new Date(questao.criado_em).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                  {questao.assignee && (
                                    <p className="text-xs text-gray-600">
                                      • Responsável: <span className="font-medium">{questao.assignee}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Respostas/Decisões */}
                            {questao.respostas && questao.respostas.length > 0 && (
                              <div className="ml-8 space-y-2 mb-3">
                                <p className="text-xs font-semibold text-gray-600 mb-2">
                                  💡 Respostas e Decisões:
                                </p>
                                {questao.respostas.map((resposta, idx) => (
                                  <div 
                                    key={idx} 
                                    className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {resposta.autor?.substring(0, 2).toUpperCase() || 'AN'}
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-900">{resposta.texto}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs font-medium text-gray-700">
                                            {resposta.autor || 'Anônimo'}
                                          </span>
                                          {resposta.criado_em && (
                                            <span className="text-xs text-gray-500">
                                              • {new Date(resposta.criado_em).toLocaleString('pt-BR')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => deletarResposta(questao.id, resposta.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                        title="Deletar resposta"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Adicionar Resposta */}
                            {questaoExpandida === questao.id ? (
                              <div className="ml-8 flex gap-2">
                                <input
                                  autoFocus
                                  type="text"
                                  value={novaResposta}
                                  onChange={(e) => setNovaResposta(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && adicionarResposta(questao.id)}
                                  placeholder="Digite sua resposta ou decisão..."
                                  className="flex-1 border-2 border-indigo-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                                <button
                                  onClick={() => adicionarResposta(questao.id)}
                                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                >
                                  Enviar
                                </button>
                                <button
                                  onClick={() => {
                                    setQuestaoExpandida(null);
                                    setNovaResposta('');
                                  }}
                                  className="text-gray-600 hover:text-gray-900 p-2"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setQuestaoExpandida(questao.id)}
                                className="ml-8 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
                              >
                                <Plus className="w-4 h-4" />
                                Adicionar resposta/decisão
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-3">Nenhuma questão para resolver</p>
                    )}
                    
                    {/* Adicionar Nova Questão */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={novaQuestao} 
                        onChange={(e) => setNovaQuestao(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && adicionarQuestao()} 
                        placeholder="Nova pergunta ou ideia a resolver..." 
                        className="flex-1 border-2 border-orange-300 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200" 
                      />
                      <button 
                        onClick={adicionarQuestao} 
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Comentários */}
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comentários
                    </h3>
                    {cardSelecionado.comentarios && cardSelecionado.comentarios.length > 0 ? (
                      <div className="space-y-3 mb-3">
                        {cardSelecionado.comentarios.map((comentario) => (
                          <div key={comentario.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-900">{comentario.autor}</span>
                              <span className="text-xs text-gray-500">{new Date(comentario.data).toLocaleString('pt-BR')}</span>
                            </div>
                            <p className="text-gray-900 text-sm">{comentario.texto}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-3">Nenhum comentário ainda</p>
                    )}
                    <div className="flex gap-2">
                      <textarea value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} placeholder="Escreva um comentário..." className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" rows="2" />
                      <button onClick={adicionarComentario} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm self-end">Enviar</button>
                    </div>
                  </div>
                </div>
              )}

              {abaAtiva === 'atividades' && (
                <div className="space-y-3">
                  {cardSelecionado.atividades && cardSelecionado.atividades.length > 0 ? (
                    cardSelecionado.atividades.map((atividade) => (
                      <div key={atividade.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <Activity className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-900">
                            <span className="font-semibold">{atividade.usuario}</span> {atividade.descricao}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(atividade.data).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma atividade registrada</p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar de Ações */}
            <div className="w-48 bg-gray-50 p-4 border-l flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Ações</h3>
              <button onClick={() => { setCardDetalheAberto(false); abrirModalCard(cardSelecionado.coluna_id, cardSelecionado); }} className="w-full bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-left flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button onClick={() => setModalMoverAberto(true)} className="w-full bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-left flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Mover
              </button>
              <button onClick={() => setModalCopiarAberto(true)} className="w-full bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-left flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Copiar
              </button>
              <button onClick={() => setModalMembrosAberto(true)} className="w-full bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-left flex items-center gap-2">
                <User className="w-4 h-4" />
                Membros
              </button>
              <button onClick={abrirModalLabels} className="w-full bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-left flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Etiquetas
              </button>
              <button onClick={abrirModalData} className="w-full bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-left flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Data
              </button>
              <button onClick={abrirModalCapa} className="w-full bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-left flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Capa
              </button>
              <div className="border-t my-2"></div>
              <button onClick={arquivarCard} className="w-full bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-left flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Arquivar
              </button>
              <button onClick={() => deletarCard(cardSelecionado.id)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded text-sm text-left flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Anexo */}
      {modalAnexoAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Adicionar Anexo</h2>
              <button onClick={() => setModalAnexoAberto(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setTipoAnexo('link')}
                className={`px-4 py-2 font-medium ${tipoAnexo === 'link' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
              >
                Link
              </button>
              <button
                onClick={() => setTipoAnexo('upload')}
                className={`px-4 py-2 font-medium ${tipoAnexo === 'upload' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
              >
                Upload de Arquivo
              </button>
            </div>

            {/* Conteúdo */}
            <div className="space-y-4">
              {tipoAnexo === 'link' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Anexo</label>
                    <input 
                      type="text" 
                      value={novoAnexo.nome} 
                      onChange={(e) => setNovoAnexo({ ...novoAnexo, nome: e.target.value })} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                      placeholder="Ex: Contrato Final" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL/Link</label>
                    <input 
                      type="url" 
                      value={novoAnexo.url} 
                      onChange={(e) => setNovoAnexo({ ...novoAnexo, url: e.target.value })} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                      placeholder="https://drive.google.com/file/..." 
                    />
                    <p className="text-xs text-gray-500 mt-1">Cole o link do Google Drive, Dropbox, etc.</p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selecione um Arquivo</label>
                  <input
                    type="file"
                    onChange={(e) => setArquivoUpload(e.target.files[0])}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {arquivoUpload && (
                    <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="text-sm font-medium text-indigo-900">{arquivoUpload.name}</p>
                          <p className="text-xs text-indigo-600">
                            {(arquivoUpload.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Tamanho máximo: 10MB</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setModalAnexoAberto(false);
                  setNovoAnexo({ nome: '', url: '', tipo: 'link' });
                  setArquivoUpload(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarAnexo}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                disabled={tipoAnexo === 'link' ? (!novoAnexo.nome.trim() || !novoAnexo.url.trim()) : !arquivoUpload}
              >
                Adicionar Anexo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mover */}
      {modalMoverAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mover Card</h2>
            <div className="space-y-2">
              {colunas.map((coluna) => (
                <button key={coluna.id} onClick={() => setColunaSelecionadaMover(coluna.id)} className={`w-full text-left px-4 py-3 rounded-lg border-2 ${colunaSelecionadaMover === coluna.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  {coluna.titulo}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalMoverAberto(false)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={moverCard} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700" disabled={!colunaSelecionadaMover}>Mover</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Copiar */}
      {modalCopiarAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Copiar Card</h2>
            <p className="text-gray-600 mb-4">Selecione a coluna de destino (opcional)</p>
            <div className="space-y-2">
              {colunas.map((coluna) => (
                <button key={coluna.id} onClick={() => setColunaSelecionadaMover(coluna.id)} className={`w-full text-left px-4 py-3 rounded-lg border-2 ${colunaSelecionadaMover === coluna.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  {coluna.titulo}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalCopiarAberto(false)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={copiarCard} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Copiar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Membros */}
      {modalMembrosAberto && cardSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Membros</h2>
              <button onClick={() => setModalMembrosAberto(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Lista de Membros */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Membros do Card:</label>
                {cardSelecionado.assignees && cardSelecionado.assignees.length > 0 ? (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {cardSelecionado.assignees.map((membro, i) => (
                      <div key={i} className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-full text-sm flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {membro}
                        <button 
                          onClick={async () => {
                            await removerMembro(membro);
                            // Recarregar card para atualizar a lista
                            const token = localStorage.getItem('token');
                            const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            setCardSelecionado(response.data);
                          }} 
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-3">Nenhum membro atribuído</p>
                )}
              </div>

              {/* Adicionar Membro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Membros:</label>
                
                {/* Lista de Membros Disponíveis */}
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {membrosDisponiveis.length > 0 ? (
                    membrosDisponiveis.map((membro) => {
                      const jaAdicionado = cardSelecionado.assignees?.includes(membro.username);
                      
                      return (
                        <button
                          key={membro.id}
                          onClick={async () => {
                            if (jaAdicionado) {
                              await removerMembro(membro.username);
                            } else {
                              setNovoMembro(membro.username);
                              await adicionarMembro();
                            }
                            // Recarregar card
                            const token = localStorage.getItem('token');
                            const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            setCardSelecionado(response.data);
                            setNovoMembro('');
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-indigo-50 flex items-center justify-between border-b border-gray-100 last:border-b-0 ${
                            jaAdicionado ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MemberAvatar username={membro.username} size="sm" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{membro.username}</div>
                              {membro.nome && (
                                <div className="text-xs text-gray-600">{membro.nome}</div>
                              )}
                            </div>
                          </div>
                          {jaAdicionado && (
                            <div className="flex items-center gap-1 text-indigo-600">
                              <CheckSquare className="w-4 h-4" />
                              <span className="text-xs font-medium">Adicionado</span>
                            </div>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 p-3">Nenhum membro disponível</p>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  💡 Click em um membro para adicionar ou remover
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => setModalMembrosAberto(false)}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Data de Vencimento */}
      {modalDataAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Data de Vencimento</h2>
              <button onClick={() => setModalDataAberto(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                <input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                <input
                  type="time"
                  value={horaVencimento}
                  onChange={(e) => setHoraVencimento(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Preview */}
              {dataVencimento && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 mb-1">Data selecionada:</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <p className="text-sm font-medium text-indigo-900">
                      {new Date(`${dataVencimento}T${horaVencimento}`).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t flex gap-3">
              {cardSelecionado?.data_vencimento && (
                <button
                  onClick={removerData}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100"
                >
                  Remover Data
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setModalDataAberto(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={salvarData}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                disabled={!dataVencimento}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Capa */}
      {modalCapaAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Capa do Cartão</h2>
              <button onClick={() => setModalCapaAberto(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setTipoCapaSelecionado('cor')}
                className={`px-4 py-2 font-medium ${tipoCapaSelecionado === 'cor' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
              >
                Cores
              </button>
              <button
                onClick={() => setTipoCapaSelecionado('imagem')}
                className={`px-4 py-2 font-medium ${tipoCapaSelecionado === 'imagem' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
              >
                Imagem
              </button>
            </div>

            {/* Conteúdo */}
            <div className="space-y-4">
              {tipoCapaSelecionado === 'cor' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Escolha uma cor:</label>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
                      '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#6366F1'
                    ].map((cor) => (
                      <button
                        key={cor}
                        onClick={() => setCapaCor(cor)}
                        className={`h-16 rounded-lg ${capaCor === cor ? 'ring-4 ring-offset-2 ring-gray-400' : ''}`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                  
                  {/* Preview */}
                  {capaCor && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <div className="w-full h-32 rounded-lg" style={{ backgroundColor: capaCor }} />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem:</label>
                  <input
                    type="url"
                    value={capaUrl}
                    onChange={(e) => setCapaUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                  />
                  
                  <p className="text-xs text-gray-500 mb-3">Cole o link de uma imagem da web (Unsplash, Pinterest, etc)</p>
                  
                  {/* Preview */}
                  {capaUrl && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                        <img src={capaUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src = ''} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t flex gap-3">
              {(cardSelecionado?.capa_url || cardSelecionado?.capa_cor) && (
                <button
                  onClick={removerCapa}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100"
                >
                  Remover Capa
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setModalCapaAberto(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={salvarCapa}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Etiquetas Estilo Trello */}
      {modalLabelAberto && cardSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-0 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <button
                onClick={() => {
                  if (criandoLabel || editandoLabel) {
                    setCriandoLabel(false);
                    setEditandoLabel(null);
                    setNovaLabel({ name: '', color: 'red' });
                  }
                }}
                className={`${criandoLabel || editandoLabel ? '' : 'invisible'}`}
              >
                <ArrowRight className="w-5 h-5 text-gray-600 transform rotate-180" />
              </button>
              <h2 className="text-sm font-semibold text-gray-700">
                {criandoLabel ? 'Criar etiqueta' : editandoLabel ? 'Editar etiqueta' : 'Etiquetas'}
              </h2>
              <button onClick={() => {
                setModalLabelAberto(false);
                setCriandoLabel(false);
                setEditandoLabel(null);
                setBuscaLabel('');
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Criar/Editar Label */}
            {(criandoLabel || editandoLabel) ? (
              <div className="p-4 space-y-3">
                {/* Preview */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Prévia:</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="px-3 py-1.5 rounded-md text-white text-sm font-medium shadow-sm"
                      style={{ backgroundColor: LABEL_COLORS.find(c => c.value === (editandoLabel?.color || novaLabel.color))?.hex }}
                    >
                      {(editandoLabel?.name || novaLabel.name) || 'Nome da etiqueta'}
                    </div>
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Título</label>
                  <input
                    type="text"
                    value={editandoLabel ? editandoLabel.name : novaLabel.name}
                    onChange={(e) => {
                      if (editandoLabel) {
                        setEditandoLabel({ ...editandoLabel, name: e.target.value });
                      } else {
                        setNovaLabel({ ...novaLabel, name: e.target.value });
                      }
                    }}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="Digite o nome da etiqueta"
                    autoFocus
                  />
                </div>

                {/* Selecionar Cor */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Selecionar uma cor</label>
                  <div className="grid grid-cols-5 gap-2">
                    {LABEL_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => {
                          if (editandoLabel) {
                            setEditandoLabel({ ...editandoLabel, color: color.value });
                          } else {
                            setNovaLabel({ ...novaLabel, color: color.value });
                          }
                        }}
                        className={`h-8 rounded-lg transition-transform hover:scale-110 ${
                          (editandoLabel?.color || novaLabel.color) === color.value
                            ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                            : ''
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (editandoLabel) {
                        // Salvar edição
                        const novasLabels = labelsEditando.map(l =>
                          l.color === editandoLabel.originalColor 
                            ? { name: editandoLabel.name, color: editandoLabel.color }
                            : l
                        );
                        
                        // Salvar nome personalizado globalmente
                        const novosLabelsGlobais = { ...labelsGlobais, [editandoLabel.color]: editandoLabel.name };
                        setLabelsGlobais(novosLabelsGlobais);
                        
                        setLabelsEditando(novasLabels);
                        salvarLabels(novasLabels);
                        setEditandoLabel(null);
                      } else {
                        // Criar nova
                        const novasLabels = [...labelsEditando, { ...novaLabel }];
                        
                        // Salvar nome personalizado globalmente
                        const novosLabelsGlobais = { ...labelsGlobais, [novaLabel.color]: novaLabel.name };
                        setLabelsGlobais(novosLabelsGlobais);
                        
                        setLabelsEditando(novasLabels);
                        salvarLabels(novasLabels);
                        setCriandoLabel(false);
                        setNovaLabel({ name: '', color: 'red' });
                      }
                    }}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50"
                    disabled={editandoLabel ? !editandoLabel.name.trim() : !novaLabel.name.trim()}
                  >
                    {editandoLabel ? 'Salvar' : 'Criar'}
                  </button>
                  {editandoLabel && (
                    <button
                      onClick={() => {
                        // Remover label
                        const novasLabels = labelsEditando.filter(l => l.color !== editandoLabel.originalColor);
                        setLabelsEditando(novasLabels);
                        salvarLabels(novasLabels);
                        setEditandoLabel(null);
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm"
                    >
                      Deletar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Buscar */}
                <div className="p-3 border-b">
                  <input
                    type="text"
                    value={buscaLabel}
                    onChange={(e) => setBuscaLabel(e.target.value)}
                    placeholder="Buscar etiquetas..."
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                  />
                </div>

                {/* Lista de Labels com Checkboxes */}
                <div className="p-2 max-h-64 overflow-y-auto">
                  <div className="text-xs font-medium text-gray-600 mb-2 px-2">ETIQUETAS</div>
                  {LABEL_COLORS.filter(color => {
                    const label = labelsEditando.find(l => l.color === color.value);
                    const searchTerm = buscaLabel.toLowerCase();
                    return !searchTerm || 
                           color.label.toLowerCase().includes(searchTerm) ||
                           (label?.name && label.name.toLowerCase().includes(searchTerm));
                  }).map((color) => {
                    const labelExistente = labelsEditando.find(l => l.color === color.value);
                    const isChecked = !!labelExistente;
                    
                    return (
                      <div key={color.value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-md group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              // Remover (mas manter nome em labelsGlobais)
                              const novasLabels = labelsEditando.filter(l => l.color !== color.value);
                              setLabelsEditando(novasLabels);
                              salvarLabels(novasLabels);
                            } else {
                              // Adicionar (usar nome de labelsGlobais se existir)
                              const nomePersonalizado = labelsGlobais[color.value] || '';
                              const novasLabels = [...labelsEditando, { name: nomePersonalizado, color: color.value }];
                              setLabelsEditando(novasLabels);
                              salvarLabels(novasLabels);
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div
                          className="flex-1 px-3 py-1.5 rounded-md text-white text-sm font-medium cursor-pointer"
                          style={{ backgroundColor: color.hex }}
                          onClick={() => {
                            if (isChecked) {
                              const novasLabels = labelsEditando.filter(l => l.color !== color.value);
                              setLabelsEditando(novasLabels);
                              salvarLabels(novasLabels);
                            } else {
                              const nomePersonalizado = labelsGlobais[color.value] || '';
                              const novasLabels = [...labelsEditando, { name: nomePersonalizado, color: color.value }];
                              setLabelsEditando(novasLabels);
                              salvarLabels(novasLabels);
                            }
                          }}
                        >
                          {labelsGlobais[color.value] || labelExistente?.name || color.label}
                        </div>
                        <button
                          onClick={() => {
                            setEditandoLabel({ 
                              name: labelExistente?.name || '', 
                              color: color.value,
                              originalColor: color.value
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Criar Nova Etiqueta */}
                <div className="p-2 border-t">
                  <button
                    onClick={() => setCriandoLabel(true)}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Criar nova etiqueta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Plano de Fundo */}
      {modalFundoAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Escolher Plano de Fundo</h2>
              <button onClick={() => setModalFundoAberto(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Gradientes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Gradientes</h3>
                <div className="grid grid-cols-5 gap-3">
                  {fundos.filter(f => f.id.startsWith('gradient')).map((fundo) => (
                    <button
                      key={fundo.id}
                      onClick={() => selecionarFundo(fundo.id)}
                      className={`h-20 rounded-lg ${fundo.classe} ${fundoSelecionado === fundo.id ? 'ring-4 ring-indigo-600 ring-offset-2' : 'hover:opacity-80'} transition-all`}
                      title={fundo.nome}
                    >
                      {fundoSelecionado === fundo.id && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="bg-white rounded-full p-1">
                            <CheckSquare className="w-6 h-6 text-indigo-600" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cores Sólidas */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Cores Sólidas</h3>
                <div className="grid grid-cols-5 gap-3">
                  {fundos.filter(f => f.id.startsWith('solid')).map((fundo) => (
                    <button
                      key={fundo.id}
                      onClick={() => selecionarFundo(fundo.id)}
                      className={`h-20 rounded-lg ${fundo.classe} ${fundoSelecionado === fundo.id ? 'ring-4 ring-white ring-offset-2' : 'hover:opacity-80'} transition-all`}
                      title={fundo.nome}
                    >
                      {fundoSelecionado === fundo.id && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="bg-white rounded-full p-1">
                            <CheckSquare className="w-6 h-6 text-gray-900" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Imagens/Padrões */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Padrões</h3>
                <div className="grid grid-cols-5 gap-3">
                  {fundos.filter(f => f.id.startsWith('image')).map((fundo) => (
                    <button
                      key={fundo.id}
                      onClick={() => selecionarFundo(fundo.id)}
                      className={`h-20 rounded-lg ${fundo.classe} ${fundoSelecionado === fundo.id ? 'ring-4 ring-indigo-600 ring-offset-2' : 'hover:opacity-80'} transition-all`}
                      title={fundo.nome}
                    >
                      {fundoSelecionado === fundo.id && (
                        <div className="w-full h-full flex items-center justify-center bg-black/30 rounded-lg">
                          <div className="bg-white rounded-full p-1">
                            <CheckSquare className="w-6 h-6 text-indigo-600" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => setModalFundoAberto(false)}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
