import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { RotaProtegida } from './components/RotaProtegida'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { EsqueciSenha } from './pages/EsqueciSenha'
import { RedefinirSenha } from './pages/RedefinirSenha'
import { Hoje } from './pages/Hoje'
import { Clientes } from './pages/Clientes'
import { ClienteForm } from './pages/ClienteForm'
import { ClienteFicha } from './pages/ClienteFicha'
import { Funil } from './pages/Funil'
import { EtapasFunil } from './pages/EtapasFunil'
import { Painel } from './pages/Painel'
import { Vendas } from './pages/Vendas'
import { Portfolio } from './pages/Portfolio'
import { FornecedorForm } from './pages/FornecedorForm'
import { FornecedorFicha } from './pages/FornecedorFicha'
import { LoteFicha } from './pages/LoteFicha'
import { Configuracoes } from './pages/Configuracoes'
import { ModelosEmail } from './pages/ModelosEmail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route
            path="/"
            element={
              <RotaProtegida>
                <Layout>
                  <Hoje />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/funil"
            element={
              <RotaProtegida>
                <Layout>
                  <Funil />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/funil/etapas"
            element={
              <RotaProtegida>
                <Layout>
                  <EtapasFunil />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/clientes"
            element={
              <RotaProtegida>
                <Layout>
                  <Clientes />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/clientes/novo"
            element={
              <RotaProtegida>
                <Layout>
                  <ClienteForm />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/clientes/:id"
            element={
              <RotaProtegida>
                <Layout>
                  <ClienteFicha />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/clientes/:id/editar"
            element={
              <RotaProtegida>
                <Layout>
                  <ClienteForm />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/painel"
            element={
              <RotaProtegida>
                <Layout>
                  <Painel />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/vendas"
            element={
              <RotaProtegida>
                <Layout>
                  <Vendas />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/fornecedores"
            element={
              <RotaProtegida>
                <Layout>
                  <Portfolio />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/fornecedores/novo"
            element={
              <RotaProtegida>
                <Layout>
                  <FornecedorForm />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/fornecedores/:id"
            element={
              <RotaProtegida>
                <Layout>
                  <FornecedorFicha />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/fornecedores/:id/editar"
            element={
              <RotaProtegida>
                <Layout>
                  <FornecedorForm />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/fornecedores/lotes/:id/imprimir"
            element={
              <RotaProtegida>
                <LoteFicha />
              </RotaProtegida>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <RotaProtegida>
                <Layout>
                  <Configuracoes />
                </Layout>
              </RotaProtegida>
            }
          />
          <Route
            path="/configuracoes/modelos-email"
            element={
              <RotaProtegida>
                <Layout>
                  <ModelosEmail />
                </Layout>
              </RotaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
