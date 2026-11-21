'use client';

import { useState } from 'react';
import type { Servicio } from '@/types';
import { digits, miles } from '@/lib/format';
import { useUI } from '@/context/UIContext';
import { useBarberos } from '@/hooks/useBarberos';
import { useServicios } from '@/hooks/useServicios';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Field, Select, ToggleRow } from '../ui/Form';

const DURS = [15, 30, 45, 60, 75, 90];

/** Crear o editar un servicio */
export function ServiceFormModal({ s, onClose, onSaved }: { s: Servicio | null; onClose: () => void; onSaved: (s: Servicio) => void }) {
  const { agendables } = useBarberos();
  const { guardar } = useServicios();
  const { toast } = useUI();
  const [nombre, setNombre] = useState(s?.nombre || '');
  const [desc, setDesc] = useState(s?.desc || '');
  const [precio, setPrecio] = useState(s ? miles(s.precio) : '');
  const [cat, setCat] = useState(s?.cat || 'Cabello');
  const [dur, setDur] = useState(s?.dur || 45);
  const [otra, setOtra] = useState(!!s && !DURS.includes(s.dur));
  const [ag, setAg] = useState(true);
  const [activo, setActivo] = useState(s ? s.activo : true);
  const [landing, setLanding] = useState(true);
  const [barb, setBarb] = useState<Record<string, boolean>>(() => Object.fromEntries(agendables.map((b) => [b.id, s ? b.ofrece.includes(s.id) : b.id === 'santiago' || b.id === 'julian'])));
  const [inv, setInv] = useState({ nombre: false, desc: false, precio: false });

  const onSave = async () => {
    const p = +digits(precio);
    const i = { nombre: !nombre.trim(), desc: !desc.trim(), precio: !p };
    setInv(i);
    if (i.nombre || i.desc || i.precio) { toast('Completa nombre, descripción y precio.', 'alert'); return; }
    const saved = await guardar(s?.id || null, {
      nombre: nombre.trim(), desc: desc.trim(), precio: p, cat, dur: otra ? Math.max(5, dur || 45) : dur, activo,
      barberos: Object.keys(barb).filter((k) => barb[k]),
    });
    toast(s ? 'Servicio actualizado' : 'Servicio creado: ' + saved.nombre);
    onSaved(saved);
  };

  return (
    <Modal title={s ? 'Editar servicio' : 'Nuevo servicio'} onClose={onClose}
      foot={<><button type="button" className="btn btn-quiet" onClick={onClose}>Cancelar</button><button type="button" className="btn btn-gold" onClick={onSave}><Icon name="check" size={18} />Guardar servicio</button></>}>
      <Field label="Nombre del servicio *"><input className="input" placeholder="Ej. Corte + lavado + mascarilla" value={nombre} aria-invalid={inv.nombre || undefined} onChange={(e) => setNombre(e.target.value)} /></Field>
      <Field label="Descripción *"><textarea className="textarea" rows={3} placeholder="Qué incluye. Se muestra en la landing y al agendar." value={desc} aria-invalid={inv.desc || undefined} onChange={(e) => setDesc(e.target.value)} /></Field>
      <div className="fgrid-2">
        <Field label="Precio de venta *">
          <span className="igroup" aria-invalid={inv.precio || undefined}><span>$</span><input inputMode="numeric" placeholder="35.000" value={precio} onChange={(e) => { const d = digits(e.target.value); setPrecio(d ? miles(+d) : ''); }} /></span>
        </Field>
        <Field label="Categoría"><Select options={['Cabello', 'Barba', 'Combos', 'Complementos']} value={cat} onChange={(e) => setCat(e.target.value)} /></Field>
      </div>
      <ToggleRow style={{ borderTop: 0, paddingTop: 0 }} title="Se puede agendar en línea" desc="Apágalo para servicios que solo se venden en el local, como un adicional." checked={ag} onChange={setAg} />
      <div className="field">
        <span>{ag ? 'Duración *' : 'Duración (opcional)'}</span>
        <div className="chips">
          {[...DURS, 0].map((m) => (
            <button key={m} type="button" className="chip" aria-pressed={m === 0 ? otra : !otra && dur === m} onClick={() => { if (m) { setDur(m); setOtra(false); } else setOtra(true); }}>{m ? m + ' min' : 'Otra'}</button>
          ))}
        </div>
        {otra && <span className="igroup" style={{ maxWidth: 220 }}><input type="number" min={5} step={5} value={dur} aria-label="Duración en minutos" onChange={(e) => setDur(+e.target.value)} /><span className="suf">min</span></span>}
        <span className="hint">{ag ? 'Obligatoria al agendarse en línea: es el tiempo que bloquea en la agenda del barbero.' : 'Sin agendamiento en línea la duración es solo informativa.'}</span>
      </div>
      <div className="field">
        <span>Barberos que lo ofrecen</span>
        <div className="chips">
          {agendables.map((b) => <button key={b.id} type="button" className="chip" aria-pressed={!!barb[b.id]} onClick={() => setBarb({ ...barb, [b.id]: !barb[b.id] })}><Avatar id={b.id} className="av-sm" />{b.corto}</button>)}
        </div>
      </div>
      <div className="toggles">
        <ToggleRow title="Servicio activo" desc="Se puede vender y agendar desde hoy." checked={activo} onChange={setActivo} />
        <ToggleRow title="Mostrar en la landing" desc="Aparece en “La carta de la casa”." checked={landing} onChange={setLanding} />
      </div>
    </Modal>
  );
}
