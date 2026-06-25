import { useEffect, useState } from 'react';
import Login from './pages/Login';
import OverviewDashboard from './pages/OverviewDashboard';
import CustomersDashboard from './pages/CustomersDashboard';
import ProductsDashboard from './pages/ProductsDashboard';
import OrdersDashboard from './pages/OrdersDashboard';
import SellersDashboard from './pages/SellersDashboard';
import ReviewsDashboard from './pages/ReviewsDashboard';


import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { authService, dashboardService } from './services/api';

export default function AppMain() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('overview');
  const [currency, setCurrency] = useState<'BRL' | 'VND' | 'USD'>('BRL');
  
  // Dynamic filter contexts loaded globally
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<{ cities: string[]; states: string[] }>({ cities: [], states: [] });

  const [filters, setFilters] = useState({
    startDate: '2017-01-01',
    endDate: '2018-12-31',
    orderStatus: '',
    category: '',
    state: '',
    city: ''
  });

  // Re-fetch current authenticator active profile
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Fetch filter metadata upon login
  useEffect(() => {
    if (currentUser) {
      const fetchMetadata = async () => {
        try {
          const cats = await dashboardService.getCategories();
          const locs = await dashboardService.getLocations();
          setCategories(cats);
          setLocations(locs);
        } catch (err) {
          console.error("Failed to load metadata filters:", err);
        }
      };
      fetchMetadata();
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setCurrentPage('overview');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Active view router mapping satisfying permissions per item
  const renderPage = () => {
    const role = currentUser.role;
    
    switch (currentPage) {
      case 'overview':
        return <OverviewDashboard filters={filters} currency={currency} />;
        
      case 'customers':
        if (role === 'Admin' || role === 'Business Analyst') {
          return <CustomersDashboard filters={filters} currency={currency} />;
        }
        break;
        
      case 'products':
        if (role === 'Admin' || role === 'Business Analyst') {
          return <ProductsDashboard filters={filters} currency={currency} />;
        }
        break;
        
      case 'orders':
        if (role === 'Admin' || role === 'Business Analyst' || role === 'Seller Manager') {
          return <OrdersDashboard filters={filters} currency={currency} />;
        }
        break;
        
      case 'sellers':
        if (role === 'Admin' || role === 'Business Analyst' || role === 'Seller Manager') {
          return <SellersDashboard filters={filters} />;
        }
        break;
        
      case 'reviews':
        if (role === 'Admin' || role === 'Business Analyst' || role === 'Seller Manager') {
          return <ReviewsDashboard filters={filters} />;
        }
        break;
        
      default:
        return <OverviewDashboard filters={filters} currency={currency} />;
    }
    
    // In case of blocked roles
    return (
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-rose-700 flex flex-col gap-2 font-sans text-xs">
        <h3 className="font-extrabold text-sm uppercase">Truy cập bị chặn (Blocked Access Rules)</h3>
        <p>Vai trò tài khoản hiện tại của bạn ({currentUser.role}) không đủ thẩm quyền tối thiểu để truy cập nội dung này.</p>
      </div>
    );
  };

  return (
    <div id="full-app-root" className="flex bg-slate-50 min-h-screen text-slate-700 select-none">
      
      {/* Sidebar navigation */}
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={handlePageChange} 
        currentUser={currentUser} 
      />

      {/* Main workspace layout */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top filter header panel */}
        <Header 
          currentUser={currentUser} 
          onLogout={handleLogout}
          currency={currency}
          onCurrencyChange={setCurrency}
          filters={filters}
          onFilterChange={setFilters}
          categories={categories}
          locations={locations}
        />

        {/* Dashboard contents wrapper view */}
        <main id="app-workspace-body" className="p-6 md:p-8 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderPage()}
        </main>

      </div>
    </div>
  );
}
