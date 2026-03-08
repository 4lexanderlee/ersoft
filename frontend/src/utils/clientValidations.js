/**
 * Shared client form validation utilities.
 * Used by AddClientModal and Ventas (StepCliente).
 */

/** Digits that form a fully-sequential ascending or descending string */
const BANNED_SEQUENCES = ['123456789', '987654321', '12345678', '87654321', '01234567', '76543210', '23456789', '98765432'];

const isBannedSequence = (value) =>
  BANNED_SEQUENCES.some(seq => value.includes(seq));

/**
 * Validates a document number based on its type.
 * @param {'DNI'|'CE'|'RUC'} docType
 * @param {string} value
 * @returns {string|null} error message or null if valid
 */
export const validateDocNumber = (docType, value) => {
  if (!value || !value.trim()) return 'Este campo es obligatorio.';
  if (!/^\d+$/.test(value)) return 'Solo se permiten dígitos numéricos.';

  const lengths = { DNI: 8, CE: 9, RUC: 11 };
  const required = lengths[docType] ?? 8;

  if (value.length !== required)
    return `Debe contener exactamente ${required} dígitos.`;

  if (isBannedSequence(value))
    return 'No se permiten series consecutivas (ej. 12345678, 98765432).';

  return null;
};

/**
 * Validates a phone number field.
 * @param {string} value
 * @returns {string|null}
 */
export const validatePhone = (value) => {
  if (!value || !value.trim()) return null; // optional field
  if (!/^\d+$/.test(value)) return 'Solo se permiten dígitos numéricos.';
  if (value.length !== 9) return 'Debe contener exactamente 9 dígitos.';
  return null;
};

/**
 * Validates an email field (only if filled).
 * @param {string} value
 * @returns {string|null}
 */
export const validateEmail = (value) => {
  if (!value || !value.trim()) return null; // optional field
  const trimmed = value.trim();
  if (!trimmed.includes('@')) return 'El correo debe contener el símbolo "@".';
  if (trimmed.startsWith('@')) return 'El "@" no puede estar al inicio del correo.';
  if (trimmed.endsWith('@')) return 'El "@" no puede estar al final del correo.';
  return null;
};

/**
 * Validates a name or surname field.
 * Only allows letters (including accented/Spanish: á é í ó ú ü ñ Á É Í Ó Ú Ü Ñ), spaces, and hyphens.
 * Max 35 characters.
 * @param {string} value
 * @param {string} fieldLabel - used in error messages
 * @returns {string|null}
 */
export const validateName = (value, fieldLabel = 'Este campo') => {
  if (!value || !value.trim()) return `${fieldLabel} es obligatorio.`;
  if (value.length > 35) return `${fieldLabel} no puede tener más de 35 caracteres.`;
  if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-']+$/.test(value))
    return `${fieldLabel} solo permite letras.`;
  return null;
};

/**
 * Sanitizes a name input: strips characters that are not letters/spaces/hyphens.
 * @param {string} value
 * @returns {string}
 */
export const sanitizeName = (value) =>
  value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-']/g, '').slice(0, 35);

/**
 * Sanitizes a phone input: strips non-digits, limits to 9 chars.
 * @param {string} value
 * @returns {string}
 */
export const sanitizePhone = (value) =>
  value.replace(/\D/g, '').slice(0, 9);

/**
 * Sanitizes a document number: strips non-digits, limits to the correct length.
 * @param {'DNI'|'CE'|'RUC'} docType
 * @param {string} value
 * @returns {string}
 */
export const sanitizeDocNumber = (docType, value) => {
  const lengths = { DNI: 8, CE: 9, RUC: 11 };
  const max = lengths[docType] ?? 11;
  return value.replace(/\D/g, '').slice(0, max);
};
