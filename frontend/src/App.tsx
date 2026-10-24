import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { OverviewView } from "./components/Overview/OverviewView";
import { DevicesView } from "./components/DevicesView";
import { adaptarMaceta } from "./data/adaptador";
import type { PotData } from "./data/potsData";
import { useMaceta } from "./hooks/useMaceta";
import { useDispositivos } from "./hooks/useDispositivos";
import { AlertsView } from "./components/AlertsView";
import { SettingsView } from "./components/SettingsView";
import type { UserProfile } from "./components/SettingsView";
import { AnalyticsView } from "./components/AnalyticsView";
import { notificacionesDeMaceta } from "./data/notificaciones";
import { useSalud } from "./hooks/useSalud";
import { useNotificacionesWeb } from "./hooks/useNotificacionesWeb";
import type { DispositivoCrear } from "./types/contrato";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return <Dashboard onLogout={() => setIsAuthenticated(false)} />;
}

/** Id de la maceta que se muestra mientras la lista no ha cargado (la primera del esquema inicial). */
const MACETA_INICIAL = "maceta-01";

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const lista = useDispositivos();
  // null = la primera de la lista.
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Elena R.',
    role: 'Ing. Agrónoma',
  });
  // Frecuencia de consulta elegida en Configuración (segundos).
  const [syncIntervalSeg, setSyncIntervalSeg] = useState(5);
  const selectedPotId = seleccionada ?? lista.dispositivos[0]?.id ?? MACETA_INICIAL;
  // Datos en vivo (riegos, alertas, mediciones) de la maceta seleccionada.
  const maceta = useMaceta(selectedPotId, syncIntervalSeg * 1000);
  const notificaciones = maceta.dispositivo
    ? notificacionesDeMaceta(maceta.dispositivo.nombre, maceta.alertas, maceta.riegos, maceta.conectado)
    : [];
  const salud = useSalud();
  const notificacionesWeb = useNotificacionesWeb(maceta.alertas, maceta.dispositivo?.nombre ?? "Maceta");

  // Estado global para el tema seleccionado
  const [theme, setTheme] = useState<'dark' | 'light' | 'coquette'>(() => {
    return (localStorage.getItem('agrolot-theme') as 'dark' | 'light' | 'coquette') || 'dark';
  });

  // Aplicar atributo data-theme global en la etiqueta html al cambiar
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('agrolot-theme', theme);
  }, [theme]);

  // Crea la maceta en la API y la selecciona. Si falla, el error llega al modal.
  const handleAddPot = async (datos: DispositivoCrear) => {
    const nueva = await lista.crear(datos);
    setSeleccionada(nueva.id);
  };

  // La seleccionada usa los datos completos de useMaceta; las demás, lo que trae la lista.
  const potsActualizadas: PotData[] = lista.dispositivos.map((dispositivo) =>
    dispositivo.id === selectedPotId && maceta.pot
      ? maceta.pot
      : adaptarMaceta(dispositivo, [], [], null),
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
      onSelectPot={setSeleccionada}
      onAddPot={handleAddPot}
      profile={profile}
      notificaciones={notificaciones}
      esp32Conectado={maceta.dispositivo ? maceta.conectado : null}
      salud={salud}
    >
      {/* VISTA OVERVIEW */}
      {activeTab === "overview" &&
        (!macetaSeleccionada ? (
          <div
            className="alert alert-dark border-secondary border-opacity-25 text-white"
            role="status"
          >
            {lista.cargando ? (
              "Conectando con la API…"
            ) : (
              <>
                <p className="mb-2">
                  {lista.error ?? "No hay macetas registradas todavía."}
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light"
                  onClick={lista.refrescar}
                >
                  Reintentar conexión
                </button>
              </>
            )}
          </div>
        ) : (
          <OverviewView
            pot={macetaSeleccionada}
            potsList={potsActualizadas}
            selectedPotId={selectedPotId}
            onSelectPot={setSeleccionada}
            live={maceta}
          />
        ))}

      {/* VISTA DE GESTIÓN DE DISPOSITIVOS */}
      {activeTab === "devices" && (
        <DevicesView
          potsList={potsActualizadas}
          onAddPot={handleAddPot}
          selectedPotId={selectedPotId}
          onSelectPot={setSeleccionada}
          live={{
            dispositivo: maceta.dispositivo,
            guardandoConfig: maceta.guardandoConfig,
            actualizarConfig: maceta.actualizarConfig,
          }}
          salud={salud}
        />
      )}

      {/* VISTA DE CENTRO DE ALERTAS */}
      {activeTab === "alerts" && (
        <AlertsView
          potsList={potsActualizadas}
          live={{
            potId: selectedPotId,
            nombre: maceta.dispositivo?.nombre ?? macetaSeleccionada?.name ?? selectedPotId,
            alertas: maceta.alertas,
            tieneBomba: maceta.tieneBomba,
            resolverAlerta: maceta.resolverAlerta,
            regar: () => maceta.regar(),
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
          riegoAutomatico={maceta.dispositivo?.riegoAutomatico ?? null}
          onRiegoAutomaticoChange={(activo) => maceta.actualizarConfig({ riegoAutomatico: activo })}
        />
      )}

      {/* VISTA DE ANÁLISIS */}
      {(activeTab === "analytics" || activeTab === "analiticas") && (
        <AnalyticsView
          potsList={potsActualizadas}
          selectedPotId={selectedPotId}
          onSelectPot={setSeleccionada}
          live={{ dispositivo: maceta.dispositivo }}
        />
      )}

    </Layout>
  );
}

export default App;
