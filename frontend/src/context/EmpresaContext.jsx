import React, { createContext, useContext, useState } from 'react';

const EmpresaContext = createContext();

export const useEmpresa = () => useContext(EmpresaContext);

const DEFAULT_EMPRESA = {
  // Datos generales
  razonSocial: 'ERSOFT S.A.C.',
  nombreComercial: 'ER-Soft',
  tipoDocumento: 'RUC',          // 'DNI' | 'RUS' | 'RUC'
  ruc: '20123456789',            // número de documento (se mantiene como 'ruc' para compatibilidad)
  giroNegocio: 'Desarrollo de Software y Consultoría Empresarial',
  representanteLegal: 'Alexander Lee Melgarejo',
  logoPath: null,                // base64 del logo PNG de la empresa
  // Ubicación
  departamento: 'Lima',
  provincia: 'Lima',
  distrito: 'Miraflores',
  direccion: 'Av. Pardo y Aliaga 640, Piso 3',
  // Contacto
  telefono: '01 234 5678',
  celular: '975 262 030',
  email: 'contacto@ersoft.com',
  web: 'www.ersoft.com',
  // Facturación
  serieFactura: 'F001',
  serieBoleta: 'B001',
  igv: '18',
  moneda: 'PEN',
  pieFactura: 'Gracias por su preferencia. Para consultas: contacto@ersoft.com',
  cuentaBancaria: '194-1234567890-1-23 (BCP)',
  qrPath: null,                  // base64 del QR de billetera electrónica
};

export const EmpresaProvider = ({ children }) => {
  const [empresa, setEmpresa] = useState(() => {
    const saved = localStorage.getItem('ersoft_empresa');
    return saved ? JSON.parse(saved) : DEFAULT_EMPRESA;
  });

  const updateEmpresa = (newData) => {
    const updated = { ...empresa, ...newData };
    localStorage.setItem('ersoft_empresa', JSON.stringify(updated));
    setEmpresa(updated);
  };

  return (
    <EmpresaContext.Provider value={{ empresa, updateEmpresa }}>
      {children}
    </EmpresaContext.Provider>
  );
};
