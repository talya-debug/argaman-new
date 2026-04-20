import CollectionDashboard from './pages/CollectionDashboard';
import CollectionTasks from './pages/CollectionTasks';
import Dashboard from './pages/Dashboard';
import FixQuoteLineOrder from './pages/FixQuoteLineOrder';
import LeadForm from './pages/LeadForm';
import Leads from './pages/Leads';
import Links from './pages/Links';
import NewTask from './pages/NewTask';
import ProjectDetails from './pages/ProjectDetails';
import Projects from './pages/Projects';
import QuoteDetails from './pages/QuoteDetails';
import Quotes from './pages/Quotes';
import Tasks from './pages/Tasks';
import WorkLogForm from './pages/WorkLogForm';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CollectionDashboard": CollectionDashboard,
    "CollectionTasks": CollectionTasks,
    "Dashboard": Dashboard,
    "FixQuoteLineOrder": FixQuoteLineOrder,
    "LeadForm": LeadForm,
    "Leads": Leads,
    "Links": Links,
    "NewTask": NewTask,
    "ProjectDetails": ProjectDetails,
    "Projects": Projects,
    "QuoteDetails": QuoteDetails,
    "Quotes": Quotes,
    "Tasks": Tasks,
    "WorkLogForm": WorkLogForm,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
