import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store/store'
import { ToastProvider } from './components/ui'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { FarmerList, FarmerProfile } from './pages/Farmers'
import { FarmList, FarmDetail } from './pages/Farms'
import { Inventory, ReceiveStock, TransferStock, DistributeStock, Batches, Ledger, Traceability } from './pages/Medicine'
import { AttendancePage, LeavePage, TourPage, EmployeesPage, MonitoringPage } from './pages/FieldForce'
import { VisitList, VisitWizard, VisitDetail } from './pages/Visits'
import DiseasePage from './pages/Disease'
import { TrainingList, TrainingDetail, CertificatesPage, CertificateView } from './pages/Training'
import MisPage from './pages/Mis'
import MarketplacePage from './pages/Marketplace'
import { PublicShell, Storefront, ProductPage, CartPage, CheckoutPage, OrderPage, TrackPage } from './pages/market/Public'
import { SellPage } from './pages/market/Sell'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useStore(s => s.session)
  const loc = useLocation()
  if (!session) return <Navigate to="/login" state={{ from: loc }} replace />
  return <>{children}</>
}

export default function App() {
  const session = useStore(s => s.session)
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/market" element={<PublicShell />}>
          <Route index element={<Storefront />} />
          <Route path="p/:id" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order/:id" element={<OrderPage />} />
          <Route path="track" element={<TrackPage />} />
          <Route path="sell" element={<SellPage />} />
        </Route>
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/farmers" element={<FarmerList />} />
          <Route path="/farmers/:id" element={<FarmerProfile />} />
          <Route path="/farms" element={<FarmList />} />
          <Route path="/farms/:id" element={<FarmDetail />} />
          <Route path="/medicine" element={<Inventory />} />
          <Route path="/medicine/receive" element={<ReceiveStock />} />
          <Route path="/medicine/transfer" element={<TransferStock />} />
          <Route path="/medicine/distribute" element={<DistributeStock />} />
          <Route path="/medicine/batches" element={<Batches />} />
          <Route path="/medicine/ledger" element={<Ledger />} />
          <Route path="/medicine/trace" element={<Traceability />} />
          <Route path="/field/attendance" element={<AttendancePage />} />
          <Route path="/field/leave" element={<LeavePage />} />
          <Route path="/field/tour" element={<TourPage />} />
          <Route path="/field/employees" element={<EmployeesPage />} />
          <Route path="/field/monitoring" element={<MonitoringPage />} />
          <Route path="/visits" element={<VisitList />} />
          <Route path="/visits/new" element={<VisitWizard />} />
          <Route path="/visits/:id" element={<VisitDetail />} />
          <Route path="/disease" element={<DiseasePage />} />
          <Route path="/training" element={<TrainingList />} />
          <Route path="/training/certificates" element={<CertificatesPage />} />
          <Route path="/training/certificates/:no" element={<CertificateView />} />
          <Route path="/training/:id" element={<TrainingDetail />} />
          <Route path="/mis" element={<MisPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
