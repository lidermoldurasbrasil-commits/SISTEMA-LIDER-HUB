import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, X, Edit2, Trash2, MoreVertical, Tag, Calendar, CheckSquare, MessageSquare, Clock, User } from 'lucide-react';

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

  // Form states
  const [formColuna, setFormColuna] = useState({ titulo: '', cor: null });
  const [formCard, setFormCard] = useState({
    titulo: '',
    descricao: '',
    labels: [],
    data_vencimento: ''
  });

  // Checklist e comentários
  const [novoItemChecklist, setNovoItemChecklist] = useState('');
  const [novoComentario, setNovoComentario] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Carregar colunas
      const colunasResponse = await axios.get(`${BACKEND_URL}/api/kanban/colunas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setColunas(colunasResponse.data);
      
      // Carregar todos os cards
      const cardsResponse = await axios.get(`${BACKEND_URL}/api/kanban/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Organizar cards por coluna
      const cardsOrganizados = {};
      colunasResponse.data.forEach(col => {
        cardsOrganizados[col.id] = cardsResponse.data
          .filter(card => card.coluna_id === col.id)
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

  // ========== DRAG AND DROP ==========
  const onDragEnd = async (result) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === 'column') {
      // Reordenar colunas
      const novasColunas = Array.from(colunas);
      const [removed] = novasColunas.splice(source.index, 1);
      novasColunas.splice(destination.index, 0, removed);

      // Atualizar posições
      const colunasComPosicao = novasColunas.map((col, index) => ({
        id: col.id,
        posicao: index
      }));

      setColunas(novasColunas);

      try {
        const token = localStorage.getItem('token');
        await axios.post(
          `${BACKEND_URL}/api/kanban/colunas/reordenar`,
          { colunas: colunasComPosicao },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Erro ao reordenar colunas:', error);
        toast.error('Erro ao reordenar colunas');
        carregarDados();
      }
    } else {
      // Mover card
      const colunaOrigemId = source.droppableId;
      const colunaDestinoId = destination.droppableId;

      if (colunaOrigemId === colunaDestinoId) {
        // Mover dentro da mesma coluna
        const novosCards = Array.from(cards[colunaOrigemId]);
        const [cardMovido] = novosCards.splice(source.index, 1);
        novosCards.splice(destination.index, 0, cardMovido);

        setCards({ ...cards, [colunaOrigemId]: novosCards });
      } else {
        // Mover para outra coluna
        const cardsOrigem = Array.from(cards[colunaOrigemId]);
        const cardsDestino = Array.from(cards[colunaDestinoId] || []);

        const [cardMovido] = cardsOrigem.splice(source.index, 1);
        cardsDestino.splice(destination.index, 0, cardMovido);

        setCards({
          ...cards,
          [colunaOrigemId]: cardsOrigem,
          [colunaDestinoId]: cardsDestino
        });
      }

      // Atualizar no backend
      try {
        const token = localStorage.getItem('token');
        const cardId = cards[colunaOrigemId][source.index].id;

        await axios.post(
          `${BACKEND_URL}/api/kanban/cards/mover`,
          {
            card_id: cardId,
            coluna_destino_id: colunaDestinoId,
            nova_posicao: destination.index
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Erro ao mover card:', error);
        toast.error('Erro ao mover card');
        carregarDados();
      }
    }
  };

  // ========== COLUNAS ==========
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
        // Atualizar
        await axios.put(
          `${BACKEND_URL}/api/kanban/colunas/${colunaEditando.id}`,
          formColuna,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Coluna atualizada!');
      } else {
        // Criar
        await axios.post(
          `${BACKEND_URL}/api/kanban/colunas`,
          formColuna,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Coluna criada!');
      }

      setModalColunaAberto(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar coluna:', error);
      toast.error('Erro ao salvar coluna');
    }
  };

  const deletarColuna = async (colunaId) => {
    if (!window.confirm('Tem certeza? Isso vai deletar todos os cards desta coluna também.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/kanban/colunas/${colunaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Coluna deletada!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao deletar coluna:', error);
      toast.error('Erro ao deletar coluna');
    }
  };

  // ========== CARDS ==========
  const abrirModalCard = (colunaId, card = null) => {
    setColunaIdParaNovoCard(colunaId);

    if (card) {
      setCardEditando(card);
      setFormCard({
        titulo: card.titulo,
        descricao: card.descricao || '',
        labels: card.labels || [],
        data_vencimento: card.data_vencimento || ''
      });
    } else {
      setCardEditando(null);
      setFormCard({ titulo: '', descricao: '', labels: [], data_vencimento: '' });
    }

    setModalCardAberto(true);
  };

  const salvarCard = async () => {
    if (!formCard.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (cardEditando) {
        // Atualizar
        await axios.put(
          `${BACKEND_URL}/api/kanban/cards/${cardEditando.id}`,
          formCard,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Card atualizado!');
      } else {
        // Criar
        await axios.post(
          `${BACKEND_URL}/api/kanban/cards`,
          { ...formCard, coluna_id: colunaIdParaNovoCard },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Card criado!');
      }

      setModalCardAberto(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar card:', error);
      toast.error('Erro ao salvar card');
    }
  };

  const deletarCard = async (cardId) => {
    if (!window.confirm('Tem certeza que deseja deletar este card?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/kanban/cards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Card deletado!');
      setCardDetalheAberto(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao deletar card:', error);
      toast.error('Erro ao deletar card');
    }
  };

  const abrirDetalheCard = async (card) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${card.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
      setCardDetalheAberto(true);
    } catch (error) {
      console.error('Erro ao carregar card:', error);
      toast.error('Erro ao carregar detalhes do card');
    }
  };

  // ========== LABELS ==========
  const adicionarLabel = (color) => {
    if (formCard.labels.some(l => l.color === color)) {
      setFormCard({
        ...formCard,
        labels: formCard.labels.filter(l => l.color !== color)
      });
    } else {
      setFormCard({
        ...formCard,
        labels: [...formCard.labels, { color, name: '' }]
      });
    }
  };

  // ========== CHECKLIST ==========
  const adicionarItemChecklist = async () => {
    if (!novoItemChecklist.trim() || !cardSelecionado) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist`,
        { texto: novoItemChecklist.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNovoItemChecklist('');
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast.error('Erro ao adicionar item');
    }
  };

  const toggleItemChecklist = async (itemId, concluido) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/checklist/${itemId}`,
        { concluido: !concluido },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  // ========== COMENTÁRIOS ==========
  const adicionarComentario = async () => {
    if (!novoComentario.trim() || !cardSelecionado) return;

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const autor = user.nome || user.username || 'Usuário';

      await axios.post(
        `${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}/comentario`,
        { autor, texto: novoComentario.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNovoComentario('');
      
      // Recarregar card
      const response = await axios.get(`${BACKEND_URL}/api/kanban/cards/${cardSelecionado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardSelecionado(response.data);
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planejamento - Kanban Board</h1>
            <p className="text-gray-600 text-sm mt-1">Organize suas tarefas com drag and drop</p>
          </div>
          <button
            onClick={() => abrirModalColuna()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Coluna
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="column">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-4 h-full"
                style={{ minWidth: 'min-content' }}
              >
                {colunas.map((coluna, index) => (
                  <Draggable key={coluna.id} draggableId={coluna.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex-shrink-0 w-80 bg-white rounded-lg shadow-md flex flex-col ${
                          snapshot.isDragging ? 'opacity-50' : ''
                        }`}
                        style={{ maxHeight: 'calc(100vh - 180px)', ...provided.draggableProps.style }}
                      >
                        {/* Header da Coluna */}
                        <div
                          {...provided.dragHandleProps}
                          className="px-4 py-3 border-b cursor-move flex justify-between items-center"
                          style={coluna.cor ? { borderTopColor: coluna.cor, borderTopWidth: '4px' } : {}}
                        >
                          <h3 className="font-semibold text-gray-900">{coluna.titulo}</h3>
                          <div className="flex gap-1">
                            <button
                              onClick={() => abrirModalColuna(coluna)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => deletarColuna(coluna.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>

                        {/* Cards da Coluna */}
                        <Droppable droppableId={coluna.id} type="card">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 overflow-y-auto p-3 space-y-2 ${
                                snapshot.isDraggingOver ? 'bg-indigo-50' : ''
                              }`}
                            >
                              {(cards[coluna.id] || []).map((card, cardIndex) => (
                                <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => abrirDetalheCard(card)}
                                      className={`bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow ${
                                        snapshot.isDragging ? 'opacity-50 rotate-2' : ''
                                      }`}
                                    >
                                      {/* Labels */}
                                      {card.labels && card.labels.length > 0 && (
                                        <div className="flex gap-1 mb-2 flex-wrap">
                                          {card.labels.map((label, i) => (
                                            <div
                                              key={i}
                                              className="h-2 w-10 rounded-full"
                                              style={{ backgroundColor: LABEL_COLORS.find(l => l.value === label.color)?.hex }}
                                            />
                                          ))}
                                        </div>
                                      )}

                                      {/* Título */}
                                      <h4 className="text-sm font-medium text-gray-900 mb-2">{card.titulo}</h4>

                                      {/* Badges */}
                                      <div className="flex items-center gap-3 text-xs text-gray-600">
                                        {card.checklist && card.checklist.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <CheckSquare className="w-3 h-3" />
                                            <span>
                                              {card.checklist.filter(i => i.concluido).length}/{card.checklist.length}
                                            </span>
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
                        <div className="p-3 border-t">
                          <button
                            onClick={() => abrirModalCard(coluna.id)}
                            className="w-full text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar card
                          </button>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {colunaEditando ? 'Editar Coluna' : 'Nova Coluna'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={formColuna.titulo}
                  onChange={(e) => setFormColuna({ ...formColuna, titulo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ex: Segunda, A Fazer, Em Progresso..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor (opcional)</label>
                <div className="flex gap-2 flex-wrap">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormColuna({ ...formColuna, cor: color.hex })}
                      className={`w-10 h-10 rounded-lg ${
                        formColuna.cor === color.hex ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                  <button
                    onClick={() => setFormColuna({ ...formColuna, cor: null })}
                    className={`w-10 h-10 rounded-lg border-2 border-gray-300 ${
                      !formColuna.cor ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                  >
                    <X className="w-4 h-4 mx-auto text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalColunaAberto(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={salvarColuna}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                {colunaEditando ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Card */}
      {modalCardAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {cardEditando ? 'Editar Card' : 'Novo Card'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={formCard.titulo}
                  onChange={(e) => setFormCard({ ...formCard, titulo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ex: Pagar Marlon, Tirar Carro Nome Mateus..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formCard.descricao}
                  onChange={(e) => setFormCard({ ...formCard, descricao: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Detalhes adicionais..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
                <div className="flex gap-2 flex-wrap">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => adicionarLabel(color.value)}
                      className={`px-4 py-2 rounded-lg text-white text-sm ${
                        formCard.labels.some(l => l.color === color.value) ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                <input
                  type="date"
                  value={formCard.data_vencimento}
                  onChange={(e) => setFormCard({ ...formCard, data_vencimento: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalCardAberto(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={salvarCard}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                {cardEditando ? 'Atualizar' : 'Criar Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes do Card */}
      {cardDetalheAberto && cardSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{cardSelecionado.titulo}</h2>
                {cardSelecionado.labels && cardSelecionado.labels.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {cardSelecionado.labels.map((label, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-white text-xs"
                        style={{ backgroundColor: LABEL_COLORS.find(l => l.value === label.color)?.hex }}
                      >
                        {LABEL_COLORS.find(l => l.value === label.color)?.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setCardDetalheAberto(false)}
                className="text-gray-500 hover:text-gray-700 ml-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Descrição */}
            {cardSelecionado.descricao && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{cardSelecionado.descricao}</p>
              </div>
            )}

            {/* Data de Vencimento */}
            {cardSelecionado.data_vencimento && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Data de Vencimento</h3>
                <div className="flex items-center gap-2 text-gray-900">
                  <Clock className="w-4 h-4" />
                  {new Date(cardSelecionado.data_vencimento).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Checklist
              </h3>
              {cardSelecionado.checklist && cardSelecionado.checklist.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {cardSelecionado.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.concluido}
                        onChange={() => toggleItemChecklist(item.id, item.concluido)}
                        className="w-4 h-4"
                      />
                      <span className={item.concluido ? 'line-through text-gray-500' : 'text-gray-900'}>
                        {item.texto}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-3">Nenhum item no checklist</p>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoItemChecklist}
                  onChange={(e) => setNovoItemChecklist(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && adicionarItemChecklist()}
                  placeholder="Adicionar item..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <button
                  onClick={adicionarItemChecklist}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Comentários */}
            <div className="mb-6">
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
                        <span className="text-xs text-gray-500">
                          {new Date(comentario.data).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-gray-900 text-sm">{comentario.texto}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-3">Nenhum comentário ainda</p>
              )}
              
              <div className="flex gap-2">
                <textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  rows="2"
                />
                <button
                  onClick={adicionarComentario}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm self-end"
                >
                  Enviar
                </button>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                onClick={() => {
                  setCardDetalheAberto(false);
                  abrirModalCard(cardSelecionado.coluna_id, cardSelecionado);
                }}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Editar Card
              </button>
              <button
                onClick={() => deletarCard(cardSelecionado.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
