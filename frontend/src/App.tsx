import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { OverviewView } from "./components/Overview/OverviewView";
import { DevicesView } from "./components/DevicesView";
import { POTS_DATA } from "./data/potsData";
import type { PotData } from "./data/potsData";
import { useMaceta } from "./hooks/useMaceta";
import { AlertsView } from "./components/AlertsView";
import { SettingsView } from "./components/SettingsView";
import type { UserProfile } from "./components/SettingsView";

const POT_01_LOADING: PotData = {
  ...POTS_DATA["01"],
  name: "Maceta 01",
  crop: null,
  zone: null,
  sector: null,
  battery: null,
  soilMoisture: null,
  vwcRange: null,
  airTemp: null,
  tempMin: null,
  tempMax: null,
  airHumidity: null,
  dpv: null,
  solarExposure: null,
  waterDispensed: null,
  waterCycles: null,
  waterReservoir: null,
  reservoirPercent: null,
  isLoading: true,
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return <Dashboard onLogout={() => setIsAuthenticated(false)} />;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [potsList, setPotsList] = useState<PotData[]>(Object.values(POTS_DATA));
  const [selectedPotId, setSelectedPotId] = useState("01");
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Elena R.',
    role: 'Ing. Agrónoma',
  });
  const maceta01 = useMaceta();

  // Estado global para el tema seleccionado
  const [theme, setTheme] = useState<'dark' | 'light' | 'coquette'>(() => {
    return (localStorage.getItem('agrolot-theme') as 'dark' | 'light' | 'coquette') || 'dark';
  });

  // Aplicar atributo data-theme global en la etiqueta html al cambiar
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('agrolot-theme', theme);
  }, [theme]);

  const handleAddPot = (newPot: PotData) => {
    setPotsList((prev) => [...prev, newPot]);
    setSelectedPotId(newPot.id);
  };

  const potsActualizadas = potsList.map((pot) =>
    pot.id === "01" ? (maceta01.pot ?? POT_01_LOADING) : pot,
  );

  const macetaSeleccionada = potsActualizadas.find(
    (pot) => pot.id === selectedPotId,
  );

  return (
    <Layout
      onLogout={onLogout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      potsList={potsActualizadas}
      selectedPotId={selectedPotId}
      onSelectPot={setSelectedPotId}
      onAddPot={handleAddPot}
      profile={profile}
    >
      {/* VISTA OVERVIEW */}
      {activeTab === "overview" &&
        (selectedPotId === "01" && !maceta01.pot ? (
          <div
            className="alert alert-dark border-secondary border-opacity-25 text-white"
            role="status"
          >
            {maceta01.cargando ? (
              "Conectando con la API de Maceta 01…"
            ) : (
              <>
                <p className="mb-2">
                  {maceta01.error ?? "No hay datos disponibles para Maceta 01."}
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light"
                  onClick={maceta01.refrescar}
                >
                  Reintentar conexión
                </button>
              </>
            )}
          </div>
        ) : macetaSeleccionada ? (
          <OverviewView
            pot={macetaSeleccionada}
            potsList={potsActualizadas}
            selectedPotId={selectedPotId}
            onSelectPot={setSelectedPotId}
            live={selectedPotId === "01" ? maceta01 : undefined}
          />
        ) : null)}

      {/* VISTA DE GESTIÓN DE DISPOSITIVOS */}
      {activeTab === "devices" && (
        <DevicesView potsList={potsActualizadas} onAddPot={handleAddPot} />
      )}

      {/* VISTA DE CENTRO DE ALERTAS */}
      {activeTab === "alerts" && <AlertsView potsList={potsActualizadas} />}

      {/* VISTA DE CONFIGURACIÓN CON PROPS DE TEMA */}
      {activeTab === "settings" && (
        <SettingsView currentTheme={theme} onThemeChange={setTheme} profile={profile} onProfileSave={setProfile} />
      )}

      {/* OTRAS VISTAS EN DESARROLLO */}
      {activeTab !== "overview" &&
        activeTab !== "devices" &&
        activeTab !== "alerts" &&
        activeTab !== "settings" && (
          <div
            className="p-4 rounded-3 border border-secondary border-opacity-10"
            style={{ backgroundColor: "#131B2E" }}
          >
            <h4 className="fw-bold text-white mb-2">Análisis</h4>
            <p
              className="text-secondary mb-0"
              style={{ color: "#94A3B8", fontSize: "14px" }}
            >
              Esta sección se puede construir según los requerimientos
              específicos.
            </p>
          </div>
        )}
    </Layout>
  );
}

export default App;