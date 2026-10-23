import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandThemeProvider } from "@/components/brand-theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Fixtures from "@/pages/fixtures";
import Competitions from "@/pages/competitions";
import CompetitionDetail from "@/pages/competition-detail";
import Gallery from "@/pages/gallery";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Admin from "@/pages/admin";
import DynamicPage from "@/pages/dynamic-page";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/fixtures" component={Fixtures} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin" component={Admin} />
      <Route path="/competitions/:id/return" component={CompetitionDetail} />
      <Route path="/competitions/:id" component={CompetitionDetail} />
      <Route path="/competitions" component={Competitions} />
      <Route path="/p/:slug" component={DynamicPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrandThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </BrandThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
