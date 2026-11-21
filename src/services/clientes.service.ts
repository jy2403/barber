import { digits } from '@/lib/format';
import { respond } from './http';
import { db } from './mock/db';

/** GET /clientes */
export const listarClientes = () => respond(() => db.clientes);

/** GET /clientes?cel=… · Busca un cliente registrado por su celular */
export const buscarClientePorCelular = (cel: string) =>
  respond(() => db.clientes.find((c) => digits(c.cel) === digits(cel)) || null);
