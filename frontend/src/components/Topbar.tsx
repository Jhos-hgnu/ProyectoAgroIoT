import React, { useState } from 'react';
import type { PotData } from '../data/potsData';

interface TopbarProps {
  selectedPotId: string;
  onSelectPot: (id: string) => void;
  potsList: PotData[];
  onOpenAddPotModal: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  selectedPotId, 
  onSelectPot, 
  potsList, 
  onOpenAddPotModal 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentPot = potsList.find(p => p.id === selectedPotId) || potsList[0];

  return (
    <header 
      className="px-4 py-2 d-flex align-items-center justify-content-between sticky-top border-bottom border-secondary border-opacity-10 w-100" 
      style={{ height: '68px', zIndex: 1010, backgroundColor: '#0F172A' }}
    >
      {/* SELECTOR DE MACETA, NOTIFICACIÓN Y BOTÓN AGREGAR */}
      <div className="d-flex align-items-center gap-3 ms-auto">
        <div className="position-relative">
          <button 
            className="btn rounded-pill d-flex align-items-center gap-2.5 px-3 py-2 text-white border-0"
            onClick={() => setIsOpen(!isOpen)}
            style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '13px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 10v10M12 10a4 4 0 0 1 4-4h3v3a4 4 0 0 1-4 4h-3zM12 14a4 4 0 0 0-4-4H5v3a4 4 0 0 0 4 4h3z"/>
            </svg>
            <span className="fw-medium">{currentPot?.name || 'Seleccionar Maceta'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" className="ms-1">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {isOpen && (
            <div 
              className="position-absolute mt-2 rounded-3 shadow-lg border border-secondary border-opacity-10 py-1"
              style={{ backgroundColor: '#1E293B', minWidth: '240px', zIndex: 1050, right: 0 }}
            >
              {potsList.map((pot) => (
                <button
                  key={pot.id}
                  className="w-100 text-start btn text-white border-0 px-3 py-2 d-flex align-items-center gap-2"
                  style={{ 
                    fontSize: '13px', 
                    backgroundColor: selectedPotId === pot.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent', 
                    color: selectedPotId === pot.id ? '#10B981' : '#FFFFFF' 
                  }}
                  onClick={() => {
                    onSelectPot(pot.id);
                    setIsOpen(false);
                  }}
                >
                  <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: selectedPotId === pot.id ? '#10B981' : 'transparent' }}></span>
                  {pot.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* NOTIFICACIONES */}
        <button 
          className="btn btn-sm position-relative rounded-circle d-flex align-items-center justify-content-center border-0" 
          style={{ backgroundColor: '#1E293B', width: '38px', height: '38px', color: '#F8FAFC' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span 
            className="position-absolute rounded-circle" 
            style={{ top: '8px', right: '8px', width: '7px', height: '7px', backgroundColor: '#10B981' }}
          ></span>
        </button>

        {/* BOTÓN AGREGAR */}
        <button 
          className="btn btn-sm fw-semibold d-flex align-items-center gap-2 border-0 px-3.5 py-2 rounded-3 text-dark" 
          style={{ backgroundColor: '#10B981', fontSize: '13px', cursor: 'pointer' }}
          onClick={onOpenAddPotModal}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#022C22" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Agregar</span>
        </button>
      </div>
    </header>
  );
};