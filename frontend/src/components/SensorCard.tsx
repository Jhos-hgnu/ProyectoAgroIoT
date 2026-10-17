import React from 'react';
import { Card, Badge } from 'react-bootstrap';

interface SensorCardProps {
  titulo: string;
  valor: string | number;
  unidad: string;
  estado: string;
  icono: string;
  colorHeader?: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  titulo,
  valor,
  unidad,
  estado,
  icono,
  colorHeader = 'primary',
}) => {
  const esActivo = estado === 'ACTIVO';

  return (
    <Card className="h-100 shadow-sm border-0">
      <Card.Header className={`bg-${colorHeader} text-white d-flex justify-content-between align-items-center py-3`}>
        <span className="fw-semibold fs-6">
          <i className={`bi ${icono} me-2`}></i>
          {titulo}
        </span>
        <Badge bg={esActivo ? 'light' : 'secondary'} text={esActivo ? 'dark' : 'white'}>
          {estado}
        </Badge>
      </Card.Header>
      <Card.Body className="d-flex flex-column justify-content-center text-center py-4">
        <h2 className="display-5 fw-bold mb-0">
          {valor} <small className="fs-5 text-muted">{unidad}</small>
        </h2>
      </Card.Body>
    </Card>
  );
};