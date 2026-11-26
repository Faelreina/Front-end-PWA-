import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { API_URL } from './src/config';

const STATUS_OPCOES = ['Assistindo', 'Concluído', 'Planejo Assistir'];
const FILTROS_TABS = [
  { id: 'Todos', label: 'Todos' },
  { id: 'Assistindo', label: 'Assistindo' },
  { id: 'Concluído', label: 'Concluídos' },
  { id: 'Planejo Assistir', label: 'Na Fila' },
  { id: 'Favoritos', label: '★ Favoritos' },
];


export default function App() {
  const [animes, setAnimes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);

  // Filtros e busca
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // Modais: Cadastro/Edição, Detalhes ("Exibir Obra") e Confirmação de Exclusão
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [erroForm, setErroForm] = useState('');

  const [obraExibida, setObraExibida] = useState(null);
  const [obraParaExcluir, setObraParaExcluir] = useState(null);

  // Campos do formulário
  const [formTitulo, setFormTitulo] = useState('');
  const [formArco, setFormArco] = useState('');
  const [formProtagonista, setFormProtagonista] = useState('');
  const [formAntagonista, setFormAntagonista] = useState('');
  const [formGenero, setFormGenero] = useState('');
  const [formEpisodios, setFormEpisodios] = useState('24');
  const [formNota, setFormNota] = useState('9.5');
  const [formStatus, setFormStatus] = useState('Assistindo');
  const [formSinopse, setFormSinopse] = useState('');
  const [formImagemUrl, setFormImagemUrl] = useState('');

  // ----------------------------------------------------
  // READ: Listar animes do backend
  // ----------------------------------------------------
  async function carregarAnimes() {
    try {
      setCarregando(true);
      setApiOffline(false);

      const resposta = await fetch(`${API_URL}/animes`);
      if (!resposta.ok) throw new Error('Falha na API');

      const dados = await resposta.json();
      setAnimes(Array.isArray(dados) ? dados : []);
    } catch (erro) {
      // Sem fallback local: os dados só existem se vierem do backend (MongoDB)
      setApiOffline(true);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    carregarAnimes();
  }, []);

  function onRefresh() {
    setAtualizando(true);
    carregarAnimes();
  }

  // ----------------------------------------------------
  // CREATE / UPDATE: Salvar registro no backend
  // ----------------------------------------------------
  async function salvarAnime() {
    if (!formTitulo.trim()) {
      setErroForm('Informe o título do anime.');
      return;
    }
    if (!formProtagonista.trim()) {
      setErroForm('Informe o protagonista.');
      return;
    }

    setErroForm('');

    const payload = {
      titulo: formTitulo.trim(),
      arco: formArco.trim() || 'Arco Principal',
      protagonista: formProtagonista.trim(),
      antagonista: formAntagonista.trim(),
      genero: formGenero.trim() || 'Ação / Shonen',
      episodios: Math.max(1, Number(formEpisodios) || 24),
      nota: Math.min(10, Math.max(0, Number(formNota) || 9.5)),
      status: formStatus,
      sinopse: formSinopse.trim(),
      imagemUrl: formImagemUrl.trim(),
    };

    try {
      if (editandoId) {
        const res = await fetch(`${API_URL}/animes/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Falha ao editar');
      } else {
        const res = await fetch(`${API_URL}/animes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Falha ao cadastrar');
      }

      fecharModal();
      carregarAnimes();
    } catch (erro) {
      setErroForm('Erro ao salvar no backend. Verifique se a API está rodando.');
    }
  }

  // ----------------------------------------------------
  // QUICK ACTIONS: Favoritar, Excluir, Seed
  // ----------------------------------------------------
  async function alternarFavorito(anime) {
    try {
      const res = await fetch(`${API_URL}/animes/${anime._id}/favorito`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Falha ao favoritar');
      const atualizado = await res.json();
      if (obraExibida && obraExibida._id === anime._id) {
        setObraExibida(atualizado);
      }
      carregarAnimes();
    } catch (e) {
      setApiOffline(true);
    }
  }

  async function executarExclusao() {
    if (!obraParaExcluir) return;
    const alvo = obraParaExcluir;
    setObraParaExcluir(null);
    if (obraExibida && obraExibida._id === alvo._id) {
      setObraExibida(null);
    }

    try {
      const res = await fetch(`${API_URL}/animes/${alvo._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
    } catch (e) {
      setApiOffline(true);
    }
    carregarAnimes();
  }

  async function popularDadosExemplo() {
    try {
      setCarregando(true);
      await fetch(`${API_URL}/animes/seed`, { method: 'POST' });
      carregarAnimes();
    } catch (e) {
      setCarregando(false);
    }
  }

  // Controles do modal
  function abrirModalCriacao(statusPreferido) {
    setEditandoId(null);
    setErroForm('');
    setFormTitulo('');
    setFormArco('');
    setFormProtagonista('');
    setFormAntagonista('');
    setFormGenero('Ação, Shonen');
    setFormEpisodios('24');
    setFormNota('9.5');
    setFormStatus(
      STATUS_OPCOES.includes(statusPreferido)
        ? statusPreferido
        : STATUS_OPCOES.includes(filtroStatus)
        ? filtroStatus
        : 'Assistindo'
    );
    setFormSinopse('');
    setFormImagemUrl('');
    setModalVisivel(true);
  }

  function abrirModalEdicao(anime) {
    setObraExibida(null);
    setEditandoId(anime._id);
    setErroForm('');
    setFormTitulo(anime.titulo || '');
    setFormArco(anime.arco || '');
    setFormProtagonista(anime.protagonista || '');
    setFormAntagonista(anime.antagonista || '');
    setFormGenero(anime.genero || '');
    setFormEpisodios(String(anime.episodios || 24));
    setFormNota(String(anime.nota ?? 9.5));
    setFormStatus(anime.status || 'Assistindo');
    setFormSinopse(anime.sinopse || '');
    setFormImagemUrl(anime.imagemUrl || '');
    setModalVisivel(true);
  }

  function fecharModal() {
    setModalVisivel(false);
    setEditandoId(null);
    setErroForm('');
  }

  // Contadores e Filtragem (todos sempre acessíveis mesmo quando 0)
  const contadores = useMemo(() => {
    return {
      Todos: animes.length,
      Assistindo: animes.filter((a) => a.status === 'Assistindo').length,
      Concluído: animes.filter((a) => a.status === 'Concluído').length,
      'Planejo Assistir': animes.filter((a) => a.status === 'Planejo Assistir').length,
      Favoritos: animes.filter((a) => a.favorito).length,
    };
  }, [animes]);

  const animesFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return animes.filter((item) => {
      const matchBusca =
        !q ||
        item.titulo.toLowerCase().includes(q) ||
        (item.arco && item.arco.toLowerCase().includes(q)) ||
        (item.protagonista && item.protagonista.toLowerCase().includes(q)) ||
        (item.antagonista && item.antagonista.toLowerCase().includes(q));

      const matchStatus =
        filtroStatus === 'Todos'
          ? true
          : filtroStatus === 'Favoritos'
          ? Boolean(item.favorito)
          : item.status === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [animes, busca, filtroStatus]);

  // Destaque: Jujutsu Kaisen se existir, senão o primeiro anime da lista
  const jjkDestaque = useMemo(
    () => animes.find((a) => a.titulo && a.titulo.toLowerCase().includes('jujutsu')) || animes[0] || null,
    [animes]
  );

  function renderHeroHeader() {
    return (
      <View>
        {/* Destaque (vem dos dados do backend) */}
        {jjkDestaque && (
          <ImageBackground
            source={{ uri: jjkDestaque.imagemUrl || undefined }}
            style={styles.heroBackground}
            imageStyle={styles.heroBackgroundImg}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.heroTagRow}>
                <Text style={styles.heroTag}>★ ARCO LENDÁRIO EM DESTAQUE</Text>
                <Text style={styles.heroEpTag}>{jjkDestaque.episodios} Episódios</Text>
              </View>
              <Text style={styles.heroTitle}>{jjkDestaque.titulo}</Text>
              <Text style={styles.heroSubtitle}>{jjkDestaque.arco}</Text>
              <Text style={styles.heroDesc} numberOfLines={2}>
                {jjkDestaque.sinopse}
              </Text>
              <TouchableOpacity style={styles.heroBtn} onPress={() => setObraExibida(jjkDestaque)}>
                <Text style={styles.heroBtnTexto}>Exibir Obra em Destaque</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        )}

        {/* Faixa de Estatísticas Clicáveis (sempre acessíveis mesmo com 0) */}
        <View style={styles.statsStrip}>
          <TouchableOpacity style={styles.statItem} onPress={() => setFiltroStatus('Todos')}>
            <Text style={styles.statValor}>{contadores.Todos}</Text>
            <Text style={styles.statLegenda}>TODOS</Text>
          </TouchableOpacity>
          <View style={styles.statDivisor} />
          <TouchableOpacity style={styles.statItem} onPress={() => setFiltroStatus('Assistindo')}>
            <Text style={[styles.statValor, { color: '#34d399' }]}>{contadores.Assistindo}</Text>
            <Text style={styles.statLegenda}>ASSISTINDO</Text>
          </TouchableOpacity>
          <View style={styles.statDivisor} />
          <TouchableOpacity style={styles.statItem} onPress={() => setFiltroStatus('Concluído')}>
            <Text style={[styles.statValor, { color: '#e11d48' }]}>{contadores.Concluído}</Text>
            <Text style={styles.statLegenda}>CONCLUÍDOS</Text>
          </TouchableOpacity>
          <View style={styles.statDivisor} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => setFiltroStatus('Planejo Assistir')}
          >
            <Text style={[styles.statValor, { color: '#fbbf24' }]}>
              {contadores['Planejo Assistir']}
            </Text>
            <Text style={styles.statLegenda}>NA FILA</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header Vermelho e Preto */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>★</Text>
          </View>
          <View>
            <Text style={styles.logoTexto}>Anime</Text>
            <Text style={styles.logoSubtexto}>Acervo de Arcos Lendários</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.botaoAdicionar} onPress={() => abrirModalCriacao()}>
          <Text style={styles.botaoAdicionarTexto}>+ Adicionar Anime</Text>
        </TouchableOpacity>
      </View>

      {/* Banner de Conexão com Backend */}
      {apiOffline && (
        <View style={styles.bannerErro}>
          <Text style={styles.bannerErroTexto}>
            Não foi possível falar com a API em {API_URL}. Inicie o backend e confira o IP em src/config.js.
          </Text>
          <TouchableOpacity onPress={carregarAnimes} style={styles.bannerErroBtn}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Reconectar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Barra de Busca */}
      <View style={styles.buscaRow}>
        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar por anime, arco, protagonista ou vilão..."
          placeholderTextColor="#64748b"
          value={busca}
          onChangeText={setBusca}
        />
        {busca !== '' && (
          <TouchableOpacity onPress={() => setBusca('')} style={styles.limparBusca}>
            <Text style={{ color: '#94a3b8' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros sempre acessíveis (Todos, Assistindo, Concluídos, Na Fila, Favoritos) */}
      <View style={{ maxHeight: 44 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosRow}
        >
          {FILTROS_TABS.map((tab) => {
            const ativo = filtroStatus === tab.id;
            const qtd = contadores[tab.id] ?? 0;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFiltroStatus(tab.id)}
                style={[styles.filtroPill, ativo && styles.filtroPillAtivo]}
              >
                <Text style={[styles.filtroPillTexto, ativo && styles.filtroPillTextoAtivo]}>
                  {tab.label} ({qtd})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Cards Verticais */}
      {carregando && !atualizando ? (
        <View style={styles.centralizado}>
          <ActivityIndicator size="large" color="#e11d48" />
          <Text style={styles.textoCarregando}>Carregando acervo de animes...</Text>
        </View>
      ) : (
        <FlatList
          data={animesFiltrados}
          keyExtractor={(item) => String(item._id)}
          ListHeaderComponent={renderHeroHeader}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={onRefresh}
              tintColor="#e11d48"
              colors={['#e11d48']}
            />
          }
          contentContainerStyle={styles.listaConteudo}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Text style={styles.vazioTitulo}>Nenhum anime em "{filtroStatus}"</Text>
              <Text style={styles.vazioDescricao}>
                Adicione um novo anime diretamente nesta categoria ou restaure o catálogo oficial.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <TouchableOpacity
                  style={styles.botaoSeed}
                  onPress={() => abrirModalCriacao(filtroStatus)}
                >
                  <Text style={styles.botaoSeedTexto}>+ Adicionar nesta aba</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.botaoSeed, { backgroundColor: '#1e1b24', borderWidth: 1, borderColor: '#e11d48' }]}
                  onPress={popularDadosExemplo}
                >
                  <Text style={styles.botaoSeedTexto}>Restaurar 18 Animes</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Pôster 2:3 clicável para Exibir Obra */}
              <TouchableOpacity
                style={styles.posterWrapper}
                activeOpacity={0.85}
                onPress={() => setObraExibida(item)}
              >
                {item.imagemUrl ? (
                  <Image source={{ uri: item.imagemUrl }} style={styles.posterImg} />
                ) : (
                  <View style={styles.posterFallback}>
                    <Text style={styles.posterFallbackTexto}>★</Text>
                  </View>
                )}

                <View style={styles.posterBadges}>
                  <View
                    style={[
                      styles.badgeStatus,
                      item.status === 'Assistindo' && { backgroundColor: 'rgba(16, 185, 129, 0.9)' },
                      item.status === 'Concluído' && { backgroundColor: 'rgba(225, 29, 72, 0.9)' },
                      item.status === 'Planejo Assistir' && { backgroundColor: 'rgba(245, 158, 11, 0.9)' },
                    ]}
                  >
                    <Text style={styles.badgeStatusTexto}>
                      {item.status === 'Planejo Assistir' ? 'Na Fila' : item.status}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => alternarFavorito(item)}
                    style={styles.favoritoBtn}
                  >
                    <Text style={{ fontSize: 12 }}>{item.favorito ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Corpo do Card */}
              <View style={styles.cardCorpo}>
                <View>
                  <View style={styles.estudioRow}>
                    <Text style={styles.protagonistaTexto} numberOfLines={1}>
                      {item.protagonista || 'Protagonista'}
                    </Text>
                    <Text style={styles.scoreTexto}>★ {item.nota}</Text>
                  </View>

                  <TouchableOpacity onPress={() => setObraExibida(item)}>
                    <Text style={styles.tituloTexto} numberOfLines={1}>
                      {item.titulo}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.arcoTexto} numberOfLines={1}>
                    ★ {item.arco || 'Arco Principal'}
                  </Text>

                  {item.antagonista ? (
                    <Text style={styles.antagonistaTexto} numberOfLines={1}>
                      Ameaça: {item.antagonista}
                    </Text>
                  ) : null}

                  {item.sinopse ? (
                    <Text style={styles.sinopseTexto} numberOfLines={2}>
                      {item.sinopse}
                    </Text>
                  ) : null}
                </View>

                {/* Ações: Exibir Obra, Editar, Excluir */}
                <View style={styles.acoesRow}>
                  <TouchableOpacity
                    style={styles.btnExibir}
                    onPress={() => setObraExibida(item)}
                  >
                    <Text style={styles.btnExibirTexto}>Exibir Obra</Text>
                  </TouchableOpacity>

                  <View style={styles.iconesAcoes}>
                    <TouchableOpacity
                      style={styles.btnAcaoIcone}
                      onPress={() => abrirModalEdicao(item)}
                    >
                      <Text style={styles.btnEditarTexto}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnAcaoIcone, { marginLeft: 6 }]}
                      onPress={() => setObraParaExcluir(item)}
                    >
                      <Text style={styles.btnExcluirTexto}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal: Exibir Obra (Ficha Completa) */}
      <Modal
        visible={Boolean(obraExibida)}
        animationType="fade"
        transparent
        onRequestClose={() => setObraExibida(null)}
      >
        <View style={styles.modalDetalhesFundo}>
          <View style={styles.modalDetalhesCard}>
            <View style={styles.modalTopo}>
              <Text style={styles.modalTitulo} numberOfLines={1}>
                {obraExibida?.titulo || 'Obra'}
              </Text>
              <TouchableOpacity onPress={() => setObraExibida(null)}>
                <Text style={styles.modalFechar}>✕</Text>
              </TouchableOpacity>
            </View>

            {obraExibida && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {obraExibida.imagemUrl ? (
                  <Image
                    source={{ uri: obraExibida.imagemUrl }}
                    style={styles.detalhePoster}
                  />
                ) : null}

                <View style={styles.detalheBadgesRow}>
                  <Text style={styles.detalheBadge}>
                    {obraExibida.status === 'Planejo Assistir' ? 'Na Fila' : obraExibida.status}
                  </Text>
                  <Text style={[styles.detalheBadge, { color: '#fbbf24' }]}>
                    ★ {obraExibida.nota}
                  </Text>
                  <Text style={styles.detalheBadge}>{obraExibida.episodios || 24} eps</Text>
                  <TouchableOpacity onPress={() => alternarFavorito(obraExibida)}>
                    <Text style={styles.detalheBadge}>
                      {obraExibida.favorito ? '⭐ Favorito' : '☆ Favoritar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detalheBox}>
                  <Text style={styles.detalheLabel}>ARCO LENDÁRIO</Text>
                  <Text style={styles.detalheValor}>{obraExibida.arco}</Text>

                  <Text style={[styles.detalheLabel, { marginTop: 10 }]}>PROTAGONISTA</Text>
                  <Text style={styles.detalheValor}>{obraExibida.protagonista}</Text>

                  <Text style={[styles.detalheLabel, { marginTop: 10 }]}>ANTAGONISTA / AMEAÇA</Text>
                  <Text style={styles.detalheValor}>{obraExibida.antagonista || 'Não informado'}</Text>

                  <Text style={[styles.detalheLabel, { marginTop: 10 }]}>GÊNERO</Text>
                  <Text style={styles.detalheValor}>{obraExibida.genero}</Text>
                </View>

                {obraExibida.sinopse ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.detalheLabel}>SINOPSE</Text>
                    <Text style={styles.detalheSinopse}>{obraExibida.sinopse}</Text>
                  </View>
                ) : null}

                <View style={styles.detalheAcoesRow}>
                  <TouchableOpacity
                    style={[styles.btnSalvar, { flex: 1, marginTop: 0, marginBottom: 0 }]}
                    onPress={() => abrirModalEdicao(obraExibida)}
                  >
                    <Text style={styles.btnSalvarTexto}>Editar Obra</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnExcluirModal}
                    onPress={() => setObraParaExcluir(obraExibida)}
                  >
                    <Text style={styles.btnSalvarTexto}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Confirmação de Exclusão */}
      <Modal
        visible={Boolean(obraParaExcluir)}
        animationType="fade"
        transparent
        onRequestClose={() => setObraParaExcluir(null)}
      >
        <View style={styles.modalDetalhesFundo}>
          <View style={styles.confirmCard}>
            <Text style={styles.modalTitulo}>Excluir Anime?</Text>
            <Text style={styles.confirmTexto}>
              Deseja remover "{obraParaExcluir?.titulo}" do catálogo permanentemente?
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.btnCancelarConfirm}
                onPress={() => setObraParaExcluir(null)}
              >
                <Text style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmarExcluir} onPress={executarExclusao}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Criação / Edição */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent
        onRequestClose={fecharModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalFundo}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalTopo}>
              <Text style={styles.modalTitulo}>
                {editandoId ? 'Editar Anime' : 'Adicionar Anime ao Catálogo'}
              </Text>
              <TouchableOpacity onPress={fecharModal}>
                <Text style={styles.modalFechar}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {erroForm !== '' && (
                <View style={styles.erroFormBox}>
                  <Text style={styles.erroFormTexto}>{erroForm}</Text>
                </View>
              )}

              <Text style={styles.label}>Título do Anime *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Vinland Saga"
                placeholderTextColor="#64748b"
                value={formTitulo}
                onChangeText={setFormTitulo}
              />

              <Text style={styles.label}>Arco Lendário em Destaque *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Incidente de Shibuya"
                placeholderTextColor="#64748b"
                value={formArco}
                onChangeText={setFormArco}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Protagonista *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: Thorfinn"
                    placeholderTextColor="#64748b"
                    value={formProtagonista}
                    onChangeText={setFormProtagonista}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Antagonista</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: Askeladd"
                    placeholderTextColor="#64748b"
                    value={formAntagonista}
                    onChangeText={setFormAntagonista}
                  />
                </View>
              </View>

              <Text style={styles.label}>Gênero</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Ação, Fantasia Sombria, Seinen"
                placeholderTextColor="#64748b"
                value={formGenero}
                onChangeText={setFormGenero}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Episódios</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={formEpisodios}
                    onChangeText={setFormEpisodios}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Nota (0 a 10)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={formNota}
                    onChangeText={setFormNota}
                  />
                </View>
              </View>

              <Text style={styles.label}>Status</Text>
              <View style={styles.statusRow}>
                {STATUS_OPCOES.map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setFormStatus(st)}
                    style={[styles.statusPill, formStatus === st && styles.statusPillAtivo]}
                  >
                    <Text
                      style={[
                        styles.statusPillTexto,
                        formStatus === st && styles.statusPillTextoAtivo,
                      ]}
                    >
                      {st === 'Planejo Assistir' ? 'Na Fila' : st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>URL do Pôster</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="https://cdn.myanimelist.net/..."
                placeholderTextColor="#64748b"
                value={formImagemUrl}
                onChangeText={setFormImagemUrl}
                autoCapitalize="none"
              />

              {formImagemUrl.trim() !== '' && (
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <Image
                    source={{ uri: formImagemUrl.trim() }}
                    style={{ width: 90, height: 135, borderRadius: 8, backgroundColor: '#050508' }}
                  />
                </View>
              )}

              <Text style={styles.label}>Sinopse do Arco</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 65, textAlignVertical: 'top' }]}
                placeholder="Breve resumo da história..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                value={formSinopse}
                onChangeText={setFormSinopse}
              />

              <TouchableOpacity style={styles.btnSalvar} onPress={salvarAnime}>
                <Text style={styles.btnSalvarTexto}>Salvar Anime</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080c',
    paddingTop: Platform.OS === 'android' ? 35 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#270913',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#be123c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e11d48',
  },
  logoTexto: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  logoSubtexto: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  botaoAdicionar: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botaoAdicionarTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bannerErro: {
    backgroundColor: '#450a0a',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerErroTexto: {
    color: '#fca5a5',
    fontSize: 11,
    flex: 1,
    marginRight: 8,
  },
  bannerErroBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  heroBackground: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4c0519',
  },
  heroBackgroundImg: {
    opacity: 0.25,
    resizeMode: 'cover',
  },
  heroOverlay: {
    backgroundColor: 'rgba(12, 6, 10, 0.78)',
    padding: 16,
  },
  heroTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroTag: {
    color: '#fda4af',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroEpTag: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: '#fb7185',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  heroDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 10,
  },
  heroBtnTexto: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#101016',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#270913',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValor: {
    fontSize: 17,
    fontWeight: '900',
    color: '#fff',
  },
  statLegenda: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statDivisor: {
    width: 1,
    height: '60%',
    backgroundColor: '#270913',
    alignSelf: 'center',
  },
  buscaRow: {
    marginHorizontal: 16,
    marginTop: 10,
    position: 'relative',
  },
  buscaInput: {
    backgroundColor: '#101016',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#270913',
  },
  limparBusca: {
    position: 'absolute',
    right: 12,
    top: 9,
  },
  filtrosRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    alignItems: 'center',
  },
  filtroPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#101016',
    borderWidth: 1,
    borderColor: '#270913',
  },
  filtroPillAtivo: {
    backgroundColor: '#e11d48',
    borderColor: '#fb7185',
  },
  filtroPillTexto: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filtroPillTextoAtivo: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  listaConteudo: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#101016',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#270913',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  posterWrapper: {
    width: 105,
    minHeight: 155,
    position: 'relative',
    backgroundColor: '#050508',
  },
  posterImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  posterFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a050d',
  },
  posterFallbackTexto: {
    fontSize: 28,
    fontWeight: '900',
    color: '#e11d48',
  },
  posterBadges: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeStatusTexto: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  favoritoBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCorpo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  estudioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  protagonistaTexto: {
    fontSize: 10,
    color: '#fb7185',
    fontWeight: 'bold',
    flex: 1,
    marginRight: 4,
  },
  scoreTexto: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  tituloTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  arcoTexto: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: 'bold',
    marginTop: 1,
  },
  antagonistaTexto: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  sinopseTexto: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
    marginTop: 3,
  },
  acoesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#270913',
    paddingTop: 6,
  },
  btnExibir: {
    backgroundColor: '#270913',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e11d48',
  },
  btnExibirTexto: {
    color: '#fda4af',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconesAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnAcaoIcone: {
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 4,
    backgroundColor: '#161620',
  },
  btnEditarTexto: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  btnExcluirTexto: {
    fontSize: 12,
  },
  centralizado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  textoCarregando: {
    color: '#64748b',
    marginTop: 8,
    fontSize: 12,
  },
  vazio: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#101016',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#270913',
  },
  vazioTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  vazioDescricao: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: 14,
  },
  botaoSeed: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  botaoSeedTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#101016',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#3f0713',
  },
  modalDetalhesFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 18,
  },
  modalDetalhesCard: {
    backgroundColor: '#101016',
    borderRadius: 18,
    padding: 16,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#4c0519',
  },
  detalhePoster: {
    width: 140,
    height: 210,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: '#050508',
  },
  detalheBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 12,
  },
  detalheBadge: {
    backgroundColor: '#181822',
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#270913',
  },
  detalheBox: {
    backgroundColor: '#08080c',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#270913',
  },
  detalheLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fb7185',
    letterSpacing: 0.6,
  },
  detalheValor: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 2,
  },
  detalheSinopse: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
    marginTop: 4,
  },
  detalheAcoesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  btnExcluirModal: {
    backgroundColor: '#450a0a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    justifyContent: 'center',
  },
  confirmCard: {
    backgroundColor: '#101016',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#4c0519',
  },
  confirmTexto: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  btnCancelarConfirm: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnConfirmarExcluir: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  erroFormBox: {
    backgroundColor: '#450a0a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    marginBottom: 8,
  },
  erroFormTexto: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  modalFechar: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#08080c',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#270913',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  statusPill: {
    flex: 1,
    backgroundColor: '#08080c',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#270913',
  },
  statusPillAtivo: {
    backgroundColor: '#e11d48',
    borderColor: '#fb7185',
  },
  statusPillTexto: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statusPillTextoAtivo: {
    color: '#fff',
    fontWeight: 'bold',
  },
  btnSalvar: {
    backgroundColor: '#e11d48',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  btnSalvarTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
