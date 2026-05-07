import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => <></>;

// דפים ציבוריים — לא דורשים התחברות
const PUBLIC_PAGES = ['LeadForm', 'WorkLogForm'];

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// רכיב שמגן על הדפים — מציג login אם לא מחובר
function ProtectedPage({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Heebo' }}>
        <p style={{ color: '#64748b', fontSize: 16 }}>טוען...</p>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <Routes>
            {/* דף ראשי — מוגן */}
            <Route path="/" element={
              <ProtectedPage>
                <LayoutWrapper currentPageName={mainPageKey}>
                  <MainPage />
                </LayoutWrapper>
              </ProtectedPage>
            } />

            {/* כל הדפים */}
            {Object.entries(Pages).map(([path, Page]) => {
              const isPublic = PUBLIC_PAGES.includes(path);
              const pageElement = (
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              );

              return (
                <Route
                  key={path}
                  path={`/${path}`}
                  element={isPublic ? pageElement : <ProtectedPage>{pageElement}</ProtectedPage>}
                />
              );
            })}

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
