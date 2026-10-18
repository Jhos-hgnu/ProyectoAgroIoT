# Firebase Realtime Database

La API publica aquí el estado en vivo de cada maceta (ver "Firebase Realtime Database" en [`docs/contrato-api.md`](../docs/contrato-api.md)). Firebase es opcional: sin `FIREBASE_DB_URL`, la API funciona igual y `/salud` dice `NO_CONFIGURADO`.

| Archivo | Para qué |
| --- | --- |
| `database.rules.json` | Reglas de seguridad: lectura pública, solo la API escribe (con el Admin SDK, que no pasa por las reglas) |
| `firebase.json` | Configuración del emulador (base en el puerto 9000 y consola en el 4000) |
| `.firebaserc` | Proyecto `demo-agroiot`: el prefijo `demo-` hace que el emulador funcione sin cuenta de Google ni internet |

## Emulador local

Necesita Node y Java 11 o superior.

```bash
cd firebase
npx firebase-tools emulators:start --only database --project demo-agroiot
```

En `backend/.env`:

```properties
FIREBASE_DB_URL=http://127.0.0.1:9000?ns=demo-agroiot-default-rtdb
```

Con el emulador no hace falta `FIREBASE_CREDENTIALS`. Al arrancar, la API escribe la configuración de cada dispositivo y `GET /salud` debe responder `"firebase": "OK"`.

Para ver los datos, abre http://127.0.0.1:4000/database. Con `node simulador.mjs vivo` corriendo, `dispositivos/maceta-01` cambia cada 10 s. El emulador no guarda nada al cerrarse; al volver a arrancar la API, esta vuelve a escribir el estado completo.

## Firebase real

1. En la consola de Firebase: **Build → Realtime Database → Create database**, en modo bloqueado. La región `us-central1` es la más cercana a Guatemala.
2. En la pestaña **Reglas**, pega el contenido de `database.rules.json`.
3. **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada.** Guarda el JSON fuera del repositorio.
4. En `backend/.env`:

   ```properties
   FIREBASE_DB_URL=https://<proyecto>-default-rtdb.firebaseio.com
   FIREBASE_CREDENTIALS=C:/ruta/fuera/del/repo/agroiot-firebase-adminsdk.json
   ```

   En Render, `FIREBASE_CREDENTIALS` puede ser el JSON completo como variable de entorno. En `backend/.env` usa la ruta: el formato `.properties` cambia los `\n` de la llave privada.

La URL de la base aparece arriba del árbol de datos en la consola. Fuera de `us-central1` tiene la forma `https://<proyecto>-default-rtdb.<región>.firebasedatabase.app`.
