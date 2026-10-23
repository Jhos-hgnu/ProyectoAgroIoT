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
import { AnalyticsView } from "./components/AnalyticsView";
import { notificacionesDeMaceta } from "./data/notificaciones";
import { useSalud } from "./hooks/useSalud";
import { useNotificacionesWeb } from "./hooks/useNotificacionesWeb";

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
  // Frecuencia de consulta elegida en Configuración (segundos).
  const [syncIntervalSeg, setSyncIntervalSeg] = useState(5);
  const maceta01 = useMaceta('maceta-01', syncIntervalSeg * 1000);
  const notificaciones = maceta01.dispositivo
    ? notificacionesDeMaceta(maceta01.dispositivo.nombre, maceta01.alertas, maceta01.riegos, maceta01.conectado)
    : [];
  const salud = useSalud();
  const notificacionesWeb = useNotificacionesWeb(maceta01.alertas, maceta01.dispositivo?.nombre ?? "Maceta 01");

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
      notificaciones={notificaciones}
      esp32Conectado={maceta01.dispositivo ? maceta01.conectado : null}
      salud={salud}
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
        <DevicesView
          potsList={potsActualizadas}
          onAddPot={handleAddPot}
          selectedPotId={selectedPotId}
          onSelectPot={setSelectedPotId}
          live={{
            dispositivo: maceta01.dispositivo,
            guardandoConfig: maceta01.guardandoConfig,
            actualizarConfig: maceta01.actualizarConfig,
          }}
          salud={salud}
        />
      )}

      {/* VISTA DE CENTRO DE ALERTAS */}
      {activeTab === "alerts" && (
        <AlertsView
          potsList={potsActualizadas}
          live={{
            alertas: maceta01.alertas,
            tieneBomba: maceta01.tieneBomba,
            resolverAlerta: maceta01.resolverAlerta,
            regar: () => maceta01.regar(),
          }}
          notificacionesWeb={notificacionesWeb}
        />
      )}

      {/* VISTA DE CONFIGURACIÓN CON PROPS DE TEMA */}
      {activeTab === "settings" && (
        <SettingsView
          currentTheme={theme}
          onThemeChange={setTheme}
          profile={profile}
          onProfileSave={setProfile}
          syncIntervalSeg={syncIntervalSeg}
          onSyncIntervalChange={setSyncIntervalSeg}
          riegoAutomatico={maceta01.dispositivo?.riegoAutomatico ?? null}
          onRiegoAutomaticoChange={(activo) => maceta01.actualizarConfig({ riegoAutomatico: activo })}
        />
      )}

      {/* VISTA DE ANÁLISIS */}
      {(activeTab === "analytics" || activeTab === "analiticas") && (
        <AnalyticsView
          potsList={potsActualizadas}
          selectedPotId={selectedPotId}
          onSelectPot={setSelectedPotId}
          live={{ dispositivo: maceta01.dispositivo }}
        />
      )}

    </Layout>
  );
}

export default App;