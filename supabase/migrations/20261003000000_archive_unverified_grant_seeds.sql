-- The original sample grant rows used invented amounts, deadlines and programme
-- descriptions. Hide those examples until an administrator replaces them with
-- verified, current opportunities and application links.
UPDATE public.grants
SET is_active = false,
    updated_at = now()
WHERE title IN (
  'Ilima/Letsema Smallholder Support',
  'CASP Comprehensive Agricultural Support',
  'Land Bank Young Farmer Fund',
  'Gauteng Vegetable Tunnel Initiative',
  'Western Cape Drought Relief',
  'KZN Sugarcane Replanting Support',
  'Limpopo Macadamia Expansion'
)
AND is_active = true;
