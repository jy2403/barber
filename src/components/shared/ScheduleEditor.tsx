'use client';

import { useState } from 'react';
import { DIAS_ED, DIAS_ED_C, HORAS_OPC } from '@/lib/constants';
import { durTxt, hora } from '@/lib/format';
import { useUI } from '@/context/UIContext';
import type { ScheduleEditorApi } from '@/hooks/useScheduleEditor';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Select, Seg } from '../ui/Form';

/** Editor del horario de trabajo de un barbero */
export function ScheduleEditor({ hz }: { hz: ScheduleEditorApi }) {
  const { toast } = useUI();
  const { s } = hz;
  const [edit, setEdit] = useState<{ i: number; k: number; a: number; z: number; err: string } | null>(null);

  const guardarRango = () => {
    if (!edit) return;
    if (edit.z <= edit.a) { setEdit({ ...edit, err: 'La hora final debe ser posterior a la inicial.' }); return; }
    hz.setRango(edit.i, edit.k, edit.a, edit.z);
    setEdit(null);
  };

  return (
    <div className="hz">
      <div className="hz-head">
        <div>
          <h3 className="fsec-title" style={{ fontSize: 24 }}>Horario de trabajo</h3>
          <p>Define cuándo puede recibir citas. El agendamiento solo ofrece horas dentro de estas franjas.</p>
        </div>
        <Seg label="Tipo de horario" value={s.modo} onChange={hz.setModo} options={[['semana', 'Igual toda la semana'], ['dia', 'Diferente por día']]} />
      </div>

      {s.modo === 'semana' ? (
        <>
          <div className="fsub" style={{ borderTop: 0, paddingTop: 0 }}>
            <span className="label-caps">Días que trabaja</span>
            <div className="chips">
              {DIAS_ED_C.map((d, i) => (
                <button key={d} type="button" className="chip" aria-pressed={s.semana[i]} aria-label={DIAS_ED[i]} onClick={() => hz.toggleChip(i)}>{d}</button>
              ))}
            </div>
          </div>
          <div className="fsub">
            <span className="label-caps">Franjas horarias</span>
            <div className="hz-franjas">
              {s.franjas.map((f, j) => (
                <div className="hz-franja" key={j}>
                  <span className="fl">Franja {j + 1}</span>
                  <Select options={HORAS_OPC} value={f[0]} aria-label={'Inicio de la franja ' + (j + 1)} onChange={(e) => hz.setFranja(j, 0, +e.target.value)} />
                  <span className="to">a</span>
                  <Select options={HORAS_OPC} value={f[1]} aria-label={'Fin de la franja ' + (j + 1)} onChange={(e) => hz.setFranja(j, 1, +e.target.value)} />
                  <button type="button" className="btn btn-icon btn-quiet" aria-label={'Quitar franja ' + (j + 1)} disabled={s.franjas.length < 2} onClick={() => hz.delFranja(j)}>
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              ))}
            </div>
            {s.franjas.length < 3 && (
              <button type="button" className="btn btn-dashed" style={{ alignSelf: 'flex-start' }} onClick={hz.addFranja}><Icon name="plus" size={16} />Agregar franja</button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="hz-days">
            {s.dias.map((d, i) => (
              <div key={i} className={'hz-day' + (d.on ? '' : ' is-off')}>
                <button type="button" className="switch" role="switch" aria-checked={d.on} aria-label={'Trabaja el ' + DIAS_ED[i].toLowerCase()} onClick={() => hz.toggleDia(i)} />
                <span className="hz-day-name">{DIAS_ED[i]}</span>
                <div className="hz-ranges">
                  {d.on ? (
                    <>
                      {d.r.map((x, k) => (
                        <span className="hz-range" key={k}>
                          <button type="button" className="hz-range-txt" aria-label={'Editar franja ' + hora(x[0]) + ' a ' + hora(x[1])} onClick={() => setEdit({ i, k, a: x[0], z: x[1], err: '' })}>
                            {hora(x[0])} – {hora(x[1])}
                          </button>
                          <button type="button" aria-label="Quitar franja" onClick={() => hz.delRango(i, k)}><Icon name="x" size={14} /></button>
                        </span>
                      ))}
                      {d.r.length < 3 && (
                        <button type="button" className="hz-add" aria-label={'Agregar franja el ' + DIAS_ED[i].toLowerCase()} onClick={() => hz.addRango(i)}><Icon name="plus" size={16} /></button>
                      )}
                    </>
                  ) : (
                    <span className="hz-rest">Descanso</span>
                  )}
                </div>
                <span className="hz-hours">{d.on ? durTxt(d.r.reduce((a, x) => a + x[1] - x[0], 0)) : '—'}</span>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-quiet btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { hz.copiarLunes(); toast('Horario del lunes copiado de martes a sábado'); }}>
            <Icon name="copy" size={16} />Copiar el horario del lunes a los demás días
          </button>
        </>
      )}

      <div className="hz-total">
        <span><Icon name="clock" size={18} />Total semanal disponible para citas</span>
        <b>{durTxt(hz.total)}</b>
      </div>

      {edit && (
        <Modal
          title={'Franja del ' + DIAS_ED[edit.i].toLowerCase()}
          size="sm"
          onClose={() => setEdit(null)}
          foot={<><button type="button" className="btn btn-quiet" onClick={() => setEdit(null)}>Cancelar</button><button type="button" className="btn btn-gold" onClick={guardarRango}>Guardar franja</button></>}
        >
          <div className="fgrid-2">
            <label className="field">Desde<Select options={HORAS_OPC} value={edit.a} onChange={(e) => setEdit({ ...edit, a: +e.target.value, err: '' })} /></label>
            <label className="field">Hasta<Select options={HORAS_OPC} value={edit.z} onChange={(e) => setEdit({ ...edit, z: +e.target.value, err: '' })} /></label>
          </div>
          <span className="field"><span className="err">{edit.err}</span></span>
        </Modal>
      )}
    </div>
  );
}
