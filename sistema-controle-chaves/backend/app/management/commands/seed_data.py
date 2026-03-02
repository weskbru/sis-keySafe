"""
Comando: python manage.py seed_data [--only-setores]

Popula o banco com dados realistas da AEB para testes de usabilidade.
É idempotente: verifica existência antes de criar (pelo campo único de cada modelo).

Flags:
  --only-setores   Cria apenas os Setores (útil para o setup inicial do banco)

Cria (sem flag):
  - 40 Setores (lista completa da AEB — espelho do mock do frontend)
  - 10 Pessoas (6 Servidores + 4 Prestadores)
  - 20 Chaves (10 Bloco A + 10 Bloco F)
  - 3 Empréstimos ativos de exemplo (disponível, emprestado, vencido)
"""
from datetime import timedelta

from django.utils import timezone
from django.core.management.base import BaseCommand

from app.models import Setor, Pessoa, Chave, Emprestimo
from app.service.emprestimo import EmprestimoService


# Lista completa — espelho de AREA_OPTIONS do frontend (RegisterPersonModal)
SETORES = [
    'ACI - Assessoria de Cooperacao Internacional',
    'ARI - Assessoria de Relacoes Institucionais e Comunicacao',
    'AUDIN - Auditoria Interna',
    'COAD - Coordenacao de Administracao',
    'CCS - Coordenacao de Comunicacao Social',
    'CDT - Coordenacao de Desenvolvimento de Competencias e Tecnologia',
    'CEG - Coordenacao de Estruturacao e Governanca',
    'CEN - Coordenacao de Estudo Estrategicos e Novos Negocios',
    'CGP - Coordenacao de Gestao de Pessoas',
    'CLC - Coordenacao de Licenciamento, Normas e Comercializacao',
    'CMA - Coordenacao de Monitoramento e Avaliacao',
    'COF - Coordenacao de Orcamento e Financas',
    'OUV - Coordenacao de Ouvidoria e Acesso a Informacao',
    'CPP - Coordenacao de Politicas e Programas',
    'CRI - Coordenacao de Relacoes Institucionais',
    'CSA - Coordenacao de Satelites e Aplicacoes',
    'CSS - Coordenacao de Segmento Solo',
    'CTI - Coordenacao de Tecnologia da Informacao',
    'CVL - Coordenacao de Veiculos Lancadores',
    'DGEP - Diretoria de Gestao de Portfolio',
    'DGSE - Diretoria de Governanca do Setor Espacial',
    'DIEN - Diretoria de Inteligencia Estrategica e Novos Negocios',
    'DPOA - Diretoria de Planejamento, Orcamento e Administracao',
    'DIAP - Divisao de Almoxarifado e Patrimonio',
    'DAP - Divisao de Analises e Pareceres',
    'DAI - Divisao de Apoio Institucional',
    'DCAD - Divisao de Cadastro',
    'DCON - Divisao de Contabilidade',
    'DCONT - Divisao de Contratacoes',
    'DEOF - Divisao de Execucao Orcamentaria e Financeira',
    'DSEG - Divisao de Infraestrutura e Seguranca',
    'DPAG - Divisao de Pagamento',
    'DIPA - Divisao de Planejamento de Aquisicoes',
    'DPSC - Divisao de Projetos e Solucoes Corporativas',
    'DSG - Divisao de Servicos Gerais',
    'DEDH - Divisao Estrategica de Desenvolvimento Humano',
    'GAB - Gabinete',
    'PRE - Presidencia',
    'PF - Procuradoria Federal',
    'PROT - Secao de Protocolo',
]

PESSOAS = [
    # Servidores
    {
        'nome_completo': 'Joao Carlos Silva de Souza',
        'cpf': '100.200.300-10',
        'tipo_vinculo': 'SERVIDOR',
        'setor_nome': 'CTI - Coordenacao de Tecnologia da Informacao',
        'telefone': '(61) 98765-4321',
        'observacao': '',
    },
    {
        'nome_completo': 'Maria Helena Oliveira Santos',
        'cpf': '200.300.400-20',
        'tipo_vinculo': 'SERVIDOR',
        'setor_nome': 'CGP - Coordenacao de Gestao de Pessoas',
        'telefone': '(61) 97654-3210',
        'observacao': '',
    },
    {
        'nome_completo': 'Ana Beatriz Costa Ferreira',
        'cpf': '300.400.500-30',
        'tipo_vinculo': 'SERVIDOR',
        'setor_nome': 'COF - Coordenacao de Orcamento e Financas',
        'telefone': '(61) 96543-2109',
        'observacao': '',
    },
    {
        'nome_completo': 'Ricardo Mendes Alves Lima',
        'cpf': '400.500.600-40',
        'tipo_vinculo': 'SERVIDOR',
        'setor_nome': 'COAD - Coordenacao de Administracao',
        'telefone': '(61) 95432-1098',
        'observacao': '',
    },
    {
        'nome_completo': 'Fernanda Lima Rodrigues',
        'cpf': '500.600.700-50',
        'tipo_vinculo': 'SERVIDOR',
        'setor_nome': 'DSEG - Divisao de Infraestrutura e Seguranca',
        'telefone': '(61) 94321-0987',
        'observacao': '',
    },
    {
        'nome_completo': 'Bruno Henrique da Silva',
        'cpf': '600.700.800-60',
        'tipo_vinculo': 'SERVIDOR',
        'setor_nome': 'GAB - Gabinete',
        'telefone': '(61) 93210-9876',
        'observacao': '',
    },
    # Prestadores
    {
        'nome_completo': 'Carlos Eduardo Pereira',
        'cpf': '700.800.900-70',
        'tipo_vinculo': 'PRESTADOR',
        'setor_nome': None,
        'telefone': '(61) 92109-8765',
        'observacao': 'Empresa: TechService Ltda',
    },
    {
        'nome_completo': 'Patricia Gomes da Silva',
        'cpf': '800.900.100-80',
        'tipo_vinculo': 'PRESTADOR',
        'setor_nome': None,
        'telefone': '(61) 91098-7654',
        'observacao': 'Empresa: LimpezaPro',
    },
    {
        'nome_completo': 'Marcos Antonio Nascimento',
        'cpf': '900.100.200-90',
        'tipo_vinculo': 'PRESTADOR',
        'setor_nome': None,
        'telefone': '(61) 90987-6543',
        'observacao': 'Empresa: ManutencaoExpress',
    },
    {
        'nome_completo': 'Juliana Cristina Barbosa',
        'cpf': '010.020.030-00',
        'tipo_vinculo': 'PRESTADOR',
        'setor_nome': None,
        'telefone': '(61) 89876-5432',
        'observacao': 'Empresa: SecurGuard',
    },
]

CHAVES = [
    # Bloco A
    {'codigo': 'Chave A-01', 'descricao': 'Sala de Reunioes Principal', 'localizacao': 'Bloco A', 'permitir_servidor': True, 'permitir_prestador': False},
    {'codigo': 'Chave A-02', 'descricao': 'Coordenacao de TI', 'localizacao': 'Bloco A', 'permitir_servidor': True, 'permitir_prestador': True},
    {'codigo': 'Chave A-03', 'descricao': 'Sala da Diretoria', 'localizacao': 'Bloco A', 'permitir_servidor': True, 'permitir_prestador': False},
    {'codigo': 'Chave A-04', 'descricao': 'Almoxarifado Central', 'localizacao': 'Bloco A', 'permitir_servidor': True, 'permitir_prestador': True},
    {'codigo': 'Chave A-05', 'descricao': 'Sala de Treinamento', 'localizacao': 'Bloco A', 'permitir_servidor': True, 'permitir_prestador': False},
    {'codigo': 'Chave A-06', 'descricao': 'Sala de Servidores TI', 'localizacao': 'Bloco A', 'permitir_servidor': True, 'permitir_prestador': True},
    {'codigo': 'Chave A-07', 'descricao': 'Auditorio Principal', 'localizacao': 'Bloco A', 'permitir_servidor': True, 'permitir_prestador': False},
    {'codigo': 'Chave A-08', 'descricao': 'Copa e Cozinha', 'localizacao': 'Bloco A', 'permitir_servidor': True, 'permitir_prestador': True},
    {'codigo': 'Chave A-09', 'descricao': 'Deposito de Material', 'localizacao': 'Bloco A', 'permitir_servidor': True, 'permitir_prestador': True},
    {'codigo': 'Chave A-10', 'descricao': 'Sala de Atendimento ao Publico', 'localizacao': 'Bloco A', 'permitir_servidor': True, 'permitir_prestador': False},
    # Bloco F
    {'codigo': 'Chave F-01', 'descricao': 'Laboratorio de Propulsao', 'localizacao': 'Bloco F', 'permitir_servidor': True, 'permitir_prestador': False},
    {'codigo': 'Chave F-02', 'descricao': 'Sala de Controle', 'localizacao': 'Bloco F', 'permitir_servidor': True, 'permitir_prestador': True},
    {'codigo': 'Chave F-03', 'descricao': 'Deposito de Equipamentos', 'localizacao': 'Bloco F', 'permitir_servidor': True, 'permitir_prestador': True},
    {'codigo': 'Chave F-04', 'descricao': 'Sala de Reunioes Tecnicas', 'localizacao': 'Bloco F', 'permitir_servidor': True, 'permitir_prestador': False},
    {'codigo': 'Chave F-05', 'descricao': 'Coordenacao de Veiculos Lancadores', 'localizacao': 'Bloco F', 'permitir_servidor': True, 'permitir_prestador': False},
    {'codigo': 'Chave F-06', 'descricao': 'Sala de Protocolos', 'localizacao': 'Bloco F', 'permitir_servidor': True, 'permitir_prestador': True},
    {'codigo': 'Chave F-07', 'descricao': 'Laboratorio de Analise', 'localizacao': 'Bloco F', 'permitir_servidor': True, 'permitir_prestador': True},
    {'codigo': 'Chave F-08', 'descricao': 'Sala de Documentacao Tecnica', 'localizacao': 'Bloco F', 'permitir_servidor': True, 'permitir_prestador': False},
    {'codigo': 'Chave F-09', 'descricao': 'Almoxarifado Tecnico', 'localizacao': 'Bloco F', 'permitir_servidor': True, 'permitir_prestador': True},
    {'codigo': 'Chave F-10', 'descricao': 'Copa e Cozinha', 'localizacao': 'Bloco F', 'permitir_servidor': True, 'permitir_prestador': True},
]


class Command(BaseCommand):
    help = 'Popula o banco com dados realistas da AEB. Use --only-setores para criar apenas os setores.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--only-setores',
            action='store_true',
            help='Cria apenas os Setores (ignora Pessoas, Chaves e Empréstimos).',
        )

    def handle(self, *args, **kwargs):
        only_setores = kwargs['only_setores']
        self.stdout.write('\n=== seed_data: iniciando ===\n')

        setores = self._criar_setores()

        if not only_setores:
            pessoas = self._criar_pessoas(setores)
            chaves = self._criar_chaves()
            self._criar_emprestimos(chaves, pessoas)

        self.stdout.write(self.style.SUCCESS('\n=== seed_data: concluído ==='))

    def _criar_setores(self):
        self.stdout.write('▶ Setores...')
        resultado = {}
        criados = 0
        for nome in SETORES:
            setor, created = Setor.objects.get_or_create(nome=nome)
            resultado[nome] = setor
            if created:
                criados += 1
        self.stdout.write(
            self.style.SUCCESS(f'  {criados} criados, {len(SETORES) - criados} já existiam.')
        )
        return resultado

    def _criar_pessoas(self, setores):
        self.stdout.write('▶ Pessoas...')
        resultado = {}
        criados = 0
        for p in PESSOAS:
            setor = setores.get(p['setor_nome']) if p['setor_nome'] else None
            pessoa, created = Pessoa.objects.get_or_create(
                cpf=p['cpf'],
                defaults={
                    'nome_completo': p['nome_completo'],
                    'tipo_vinculo': p['tipo_vinculo'],
                    'setor': setor,
                    'telefone': p['telefone'],
                    'observacao': p['observacao'],
                    'ativo': True,
                },
            )
            resultado[p['nome_completo']] = pessoa
            if created:
                criados += 1
                self.stdout.write(f'  [CRIADO] {pessoa.nome_completo}')
            else:
                self.stdout.write(f'  [OK] {pessoa.nome_completo}')
        self.stdout.write(f'  {criados} criados, {len(PESSOAS) - criados} já existiam.')
        return resultado

    def _criar_chaves(self):
        self.stdout.write('▶ Chaves...')
        resultado = {}
        criados = 0
        for c in CHAVES:
            chave, created = Chave.objects.get_or_create(
                codigo=c['codigo'],
                defaults={
                    'descricao': c['descricao'],
                    'localizacao': c['localizacao'],
                    'status': 'DISPONIVEL',
                    'permitir_servidor': c['permitir_servidor'],
                    'permitir_prestador': c['permitir_prestador'],
                    'ativo': True,
                },
            )
            resultado[c['codigo']] = chave
            if created:
                criados += 1
        self.stdout.write(f'  {criados} criadas, {len(CHAVES) - criados} já existiam.')
        return resultado

    def _criar_emprestimos(self, chaves, pessoas):
        self.stdout.write('▶ Empréstimos de exemplo...')
        criados = 0

        chave_a03 = chaves.get('Chave A-03')
        joao = pessoas.get('Joao Carlos Silva de Souza')
        if chave_a03 and joao and chave_a03.status == 'DISPONIVEL':
            EmprestimoService.emprestar(
                chave=chave_a03,
                pessoa=joao,
                data_prevista_devolucao=None,
                observacao='Reunião com a Diretoria.',
            )
            criados += 1
            self.stdout.write(f'  [CRIADO] Chave A-03 → {joao.nome_completo} (EMPRESTADA)')

        chave_f02 = chaves.get('Chave F-02')
        carlos = pessoas.get('Carlos Eduardo Pereira')
        if chave_f02 and carlos and chave_f02.status == 'DISPONIVEL':
            hoje_23h59 = timezone.now().replace(hour=23, minute=59, second=0, microsecond=0)
            EmprestimoService.emprestar(
                chave=chave_f02,
                pessoa=carlos,
                data_prevista_devolucao=hoje_23h59,
                observacao='Manutenção preventiva sala de controle.',
            )
            criados += 1
            self.stdout.write(f'  [CRIADO] Chave F-02 → {carlos.nome_completo} (EMPRESTADA)')

        chave_a01 = chaves.get('Chave A-01')
        patricia = pessoas.get('Patricia Gomes da Silva')
        if chave_a01 and patricia and chave_a01.status == 'DISPONIVEL':
            data_vencida = timezone.now() - timedelta(hours=3)
            Emprestimo.objects.create(
                chave=chave_a01,
                pessoa=patricia,
                data_prevista_devolucao=data_vencida,
                observacao='Limpeza da sala de reunioes.',
            )
            chave_a01.status = 'EMPRESTADA'
            chave_a01.save(update_fields=['status'])
            criados += 1
            self.stdout.write(f'  [CRIADO] Chave A-01 → {patricia.nome_completo} (VENCIDO)')

        self.stdout.write(f'  {criados} empréstimos criados.')
