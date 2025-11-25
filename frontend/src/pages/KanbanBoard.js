import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, X, Edit2, Trash2, MoreVertical, Tag, Calendar, CheckSquare, MessageSquare, Clock, User, Paperclip, Copy, Archive, ArrowRight, Activity } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const LABEL_COLORS = [
  { value: 'red', label: 'Vermelho', hex: '#EF4444' },
  { value: 'blue', label: 'Azul', hex: '#3B82F6' },
  { value: 'purple', label: 'Roxo', hex: '#8B5CF6' },
  { value: 'yellow', label: 'Amarelo', hex: '#F59E0B' },
  { value: 'green', label: 'Verde', hex: '#10B981' },
  { value: 'orange', label: 'Laranja', hex: '#F97316' },
];

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
  const [novoComentario, setNovoComentario] = useState('');
  const [novoAnexo, setNovoAnexo] = useState({ nome: '', url: '', tipo: 'link' });
  const [novoMembro, setNovoMembro] = useState('');
  const [modalAnexoAberto, setModalAnexoAberto] = useState(false);
  const [modalMoverAberto, setModalMoverAberto] = useState(false);
  const [modalCopiarAberto, setModalCopiarAberto] = useState(false);
  const [colunaSelecionadaMover, setColunaSelecionadaMover] = useState(null);
  const [modalLabelAberto, setModalLabelAberto] = useState(false);
  const [adicionandoCardColuna, setAdicionandoCardColuna] = useState(null);
  const [textoNovoCard, setTextoNovoCard] = useState('');
  const [modalFundoAberto, setModalFundoAberto] = useState(false);
  const [fundoSelecionado, setFundoSelecionado] = useState('gradient-1');

  const fundos = [
    { id: 'gradient-1', nome: 'Índigo Roxo', classe: 'bg-gradient-to-br from-indigo-50 to-purple-50' },
    { id: 'gradient-2', nome: 'Azul Claro', classe: 'bg-gradient-to-br from-blue-50 to-cyan-50' },
    { id: 'gradient-3', nome: 'Rosa Suave', classe: 'bg-gradient-to-br from-pink-50 to-rose-50' },
    { id: 'gradient-4', nome: 'Verde Menta', classe: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
    { id: 'gradient-5', nome: 'Laranja Pêssego', classe: 'bg-gradient-to-br from-orange-50 to-amber-50' },
    { id: 'solid-blue', nome: 'Azul Sólido', classe: 'bg-blue-500' },
    { id: 'solid-purple', nome: 'Roxo Sólido', classe: 'bg-purple-500' },
    { id: 'solid-green', nome: 'Verde Sólido', classe: 'bg-green-500' },
    { id: 'solid-red', nome: 'Vermelho Sólido', classe: 'bg-red-500' },
    { id: 'image-1', nome: 'Padrão 1', classe: 'bg-[url("https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80")] bg-cover' },
    { id: 'image-2', nome: 'Padrão 2', classe: 'bg-[url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80")] bg-cover' },
  ];

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
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${card.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
      setCardDetalheAberto(true);
      setAbaAtiva('detalhes');
    } catch (error) {
      toast.error('Erro ao carregar detalhes do card');
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
      await axios.post(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist`, { texto: novoItemChecklist.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setNovoItemChecklist('');
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao adicionar item');
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
    if (!novoAnexo.nome.trim() || !novoAnexo.url.trim() || !cardSelecionado) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/anexo`, novoAnexo, { headers: { Authorization: `Bearer ${token}` } });
      setNovoAnexo({ nome: '', url: '', tipo: 'link' });
      setModalAnexoAberto(false);
      toast.success('Anexo adicionado!');
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCardSelecionado(response.data);
    } catch (error) {
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
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planejamento - Kanban Board</h1>
            <p className="text-gray-600 text-sm mt-1">Organize suas tarefas com drag and drop</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModalFundoAberto(true)} className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <span className="w-5 h-5 rounded border-2 border-gray-400" style={{ background: fundoAtual.id.startsWith('gradient') ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : fundoAtual.id.startsWith('solid') ? fundoAtual.classe.replace('bg-', '') : 'url(...)' }}></span>
              Plano de Fundo
            </button>
            <button onClick={() => abrirModalColuna()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
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
                      <div ref={provided.innerRef} {...provided.draggableProps} className={`flex-shrink-0 w-80 bg-white rounded-lg shadow-md flex flex-col ${snapshot.isDragging ? 'opacity-50' : ''}`} style={{ maxHeight: 'calc(100vh - 180px)', ...provided.draggableProps.style }}>
                        <div {...provided.dragHandleProps} className="px-4 py-3 border-b cursor-move flex justify-between items-center" style={coluna.cor ? { borderTopColor: coluna.cor, borderTopWidth: '4px' } : {}}>
                          <h3 className="font-semibold text-gray-900">{coluna.titulo}</h3>
                          <div className="flex gap-1">
                            <button onClick={() => abrirModalColuna(coluna)} className="p-1 hover:bg-gray-100 rounded">
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button onClick={() => deletarColuna(coluna.id)} className="p-1 hover:bg-gray-100 rounded">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>

                        <Droppable droppableId={coluna.id} type="card">
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 overflow-y-auto p-3 space-y-2 ${snapshot.isDraggingOver ? 'bg-indigo-50' : ''}`}>
                              {(cards[coluna.id] || []).map((card, cardIndex) => (
                                <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                                  {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => abrirDetalheCard(card)} className={`bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow ${snapshot.isDragging ? 'opacity-50 rotate-2' : ''}`}>
                                      {card.labels && card.labels.length > 0 && (
                                        <div className="flex gap-1 mb-2 flex-wrap">
                                          {card.labels.map((label, i) => (
                                            <div key={i} className="h-2 w-10 rounded-full" style={{ backgroundColor: LABEL_COLORS.find(l => l.value === label.color)?.hex }} />
                                          ))}
                                        </div>
                                      )}
                                      <h4 className="text-sm font-medium text-gray-900 mb-2">{card.titulo}</h4>
                                      <div className="flex items-center gap-3 text-xs text-gray-600">
                                        {card.assignees && card.assignees.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>{card.assignees.length}</span>
                                          </div>
                                        )}
                                        {card.checklist && card.checklist.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <CheckSquare className="w-3 h-3" />
                                            <span>{card.checklist.filter(i => i.concluido).length}/{card.checklist.length}</span>
                                          </div>
                                        )}
                                        {card.anexos && card.anexos.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <Paperclip className="w-3 h-3" />
                                            <span>{card.anexos.length}</span>
                                          </div>
                                        )}
                                        {card.comentarios && card.comentarios.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" />
                                            <span>{card.comentarios.length}</span>
                                          </div>
                                        )}
                                        {card.data_vencimento && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(card.data_vencimento).toLocaleDateString('pt-BR')}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {/* Adicionar Card */}
                        <div className="p-3 border-t bg-gray-50/50">
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                                rows="3"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => criarCardRapido(coluna.id)}
                                  className="bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 text-sm font-medium"
                                >
                                  Adicionar cartão
                                </button>
                                <button
                                  onClick={() => {
                                    setAdicionandoCardColuna(null);
                                    setTextoNovoCard('');
                                  }}
                                  className="text-gray-600 hover:text-gray-900 p-1.5"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAdicionandoCardColuna(coluna.id)}
                              className="w-full text-left text-sm text-gray-700 hover:bg-gray-200/70 px-2 py-1.5 rounded flex items-center gap-2 font-medium"
                            >
                              <Plus className="w-4 h-4" />
                              Adicionar um cartão
                            </button>
                          )}
                        </div>
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
                        <span key={i} className="px-3 py-1 rounded-full text-white text-xs" style={{ backgroundColor: LABEL_COLORS.find(l => l.value === label.color)?.hex }}>
                          {LABEL_COLORS.find(l => l.value === label.color)?.label}
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
                  {/* Membros */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Membros
                    </h3>
                    <div className="flex gap-2 flex-wrap mb-3">
                      {cardSelecionado.assignees && cardSelecionado.assignees.length > 0 ? (
                        cardSelecionado.assignees.map((membro, i) => (
                          <div key={i} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {membro}
                            <button onClick={() => removerMembro(membro)} className="hover:text-indigo-900">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">Nenhum membro atribuído</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={novoMembro} onChange={(e) => setNovoMembro(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && adicionarMembro()} placeholder="Nome do membro..." className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" />
                      <button onClick={adicionarMembro} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">Adicionar</button>
                    </div>
                  </div>

                  {/* Descrição */}
                  {cardSelecionado.descricao && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição</h3>
                      <p className="text-gray-900 whitespace-pre-wrap">{cardSelecionado.descricao}</p>
                    </div>
                  )}

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

                  {/* Checklist */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      Checklist
                    </h3>
                    {cardSelecionado.checklist && cardSelecionado.checklist.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {cardSelecionado.checklist.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <input type="checkbox" checked={item.concluido} onChange={() => toggleItemChecklist(item.id, item.concluido)} className="w-4 h-4" />
                            <span className={item.concluido ? 'line-through text-gray-500' : 'text-gray-900'}>{item.texto}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-3">Nenhum item no checklist</p>
                    )}
                    <div className="flex gap-2">
                      <input type="text" value={novoItemChecklist} onChange={(e) => setNovoItemChecklist(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && adicionarItemChecklist()} placeholder="Adicionar item..." className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" />
                      <button onClick={adicionarItemChecklist} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">Adicionar</button>
                    </div>
                  </div>

                  {/* Comentários */}
                  <div>
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
              <button onClick={() => setModalLabelAberto(true)} className="w-full bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-left flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Etiquetas
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
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Adicionar Anexo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do arquivo</label>
                <input type="text" value={novoAnexo.nome} onChange={(e) => setNovoAnexo({ ...novoAnexo, nome: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Ex: Relatório.pdf" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL/Link</label>
                <input type="url" value={novoAnexo.url} onChange={(e) => setNovoAnexo({ ...novoAnexo, url: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAnexoAberto(false)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={adicionarAnexo} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Adicionar</button>
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
    </div>
  );
}
