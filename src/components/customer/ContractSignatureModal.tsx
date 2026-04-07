import { useMemo, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import './ContractSignatureModal.css';

const CONTRACT_TEXT_HTML = `
  <h1 class="contract-title">SOLICITUD DE INSCRIPCIÓN / DECLARACIÓN JURADA</h1>
  <h2 class="contract-subtitle">ASOCIACIÓN THE DISTRICT 420</h2>

  <h3>Datos de inscripción</h3>
  <p>
    mayor de edad con DNI y dirección en<br />
    Aporta datos, fecha y firma del/de la socio/a aval de la condición de consumidor/a de las sustancias mencionadas en los estatutos en este documento de la solicitante de admisión.
  </p>

  <h3>Declaración jurada</h3>
  <p>Por la presente declara:</p>
  <ul>
    <li>
      Ser usuario/a de cannabis lúdico o terapéutico por haber sido diagnosticado/a de alguna enfermedad para la cual el cannabis sea eficaz para <strong>paliar sus síntomas</strong>.
    </li>
    <li>
      Ser consumidor de tabaco o asumir no tener problemas con que otros lo consuman en el recinto de la entidad.
    </li>
    <li>
      Su voluntad de pertenecer como asociado/a.
    </li>
    <li>
      No tener antecedentes penales relativos a <strong>delitos contra la salud pública</strong>.
    </li>
    <li>
      Haber leído y aceptado en su totalidad los <strong>Estatutos</strong> que rigen la entidad, y su compromiso de cumplirlos, a la vez que el <strong>Reglamento de Régimen Interno</strong>, observando sus fines sociales y respetando las decisiones de sus órganos de gobierno.
    </li>
    <li>
      Conocer y poner especial atención a los siguientes preceptos legales:
    </li>
  </ul>

  <h3>Marco Legal</h3>

  <p class="article-title">El artículo 36.16 de la Ley Orgánica 4/2015, de 30 de marzo, de protección de la seguridad ciudadana:</p>
  <p class="article-text">
    El consumo o la tenencia ilícitos de drogas tóxicas, estupfacientes o sustancias psicotrópicas, aunque no estuvieran destinadas al tráfico, en lugares, vías, establecimientos públicos o transportes colectivos, así como el abandono de los instrumentos u otros efectos empleados para ello en los citados lugares.
  </p>

  <p class="article-title">El artículo 368 del Código Penal Español, Ley Orgánica 10/1995:</p>
  <p class="article-text">
    Los que ejecuten actos de cultivo, elaboración o tráfico, o de otro modo promuevan, favorezcan o faciliten el consumo ilegal de drogas tóxicas, estupfacientes o sustancias psicotrópicas, o las posean con aquellos fines, serán castigados con las penas de prisión de tres a seis años y multa del tanto al triplo del valor de la droga objeto del delito si se tratare de sustancias o productos que causen grave daño a la salud, y de prisión de uno a tres años y multa del tanto al duplo en los demás casos.
  </p>

  <p class="article-title">El artículo 18 de la Constitución Española:</p>
  <ol>
    <li>Se garantiza el derecho al honor, a la intimidad personal y familiar y a la propia imagen.</li>
    <li>El domicilio es inviolable. Ninguna entrada o registro podrá hacerse en él sin consentimiento del titular o resolución judicial, salvo en caso de <strong>flagrante delito</strong>.</li>
    <li>Se garantiza el secreto de las comunicaciones y, en especial, de las postales, telegráficas y telefónicas, salvo resolución judicial.</li>
    <li>La Ley limitará el uso de la informática para garantizar el honor y la intimidad personal y familiar de los ciudadanos y el pleno ejercicio de sus derechos.</li>
  </ol>

  <p class="article-title">El artículo 22 de la Constitución Española:</p>
  <ol>
    <li>Se reconoce el derecho de asociación.</li>
    <li>Las asociaciones que persigan fines o utilicen medios tipificados como delito son ilegales.</li>
    <li>Las asociaciones constituidas al amparo de este artículo deberán inscribirse en un registro a los solos efectos de publicidad.</li>
    <li>Las asociaciones sólo podrán ser disueltas o suspendidas en sus actividades en virtud de resolución judicial motivada.</li>
    <li>Se prohíben las asociaciones secretas y las de carácter paramilitar.</li>
  </ol>

  <div class="contract-footer">
    <p class="signature-label-text">FIRMA:</p>
  </div>
`;

interface ContractSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSigned: (signatureDataUrl: string) => void;
  isSaving?: boolean;
}

export function ContractSignatureModal({
  isOpen,
  onClose,
  onSigned,
  isSaving = false,
}: ContractSignatureModalProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const signatureHint = useMemo(() => {
    if (hasSignature) {
      return 'Firma dentro del recuadro y presiona "Firmar contrato"';
    }
    return 'Firma con el dedo o el mouse en el recuadro';
  }, [hasSignature]);

  const handleClear = () => {
    sigRef.current?.clear();
    setHasSignature(false);
  };

  const handleConfirm = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    
    const dataUrl = sigRef.current.toDataURL('image/png');
    onSigned(dataUrl);
  };

  const handleEndStroke = () => {
    if (!sigRef.current?.isEmpty()) {
      setHasSignature(true);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Firmar contrato" closeOnOverlayClick={!isSaving}>
      <div className="contract-modal-body">
        <div
          className="contract-text"
          dangerouslySetInnerHTML={{ __html: CONTRACT_TEXT_HTML }}
        />
        <div className="signature-area">
          <div className="signature-label">{signatureHint}</div>
          <div className="canvas-wrapper">
            <SignatureCanvas
              ref={sigRef}
              penColor="#0f172a"
              canvasProps={{
                width: 600,
                height: 180,
                className: 'signature-canvas'
              }}
              onEnd={handleEndStroke}
            />
            <div className="canvas-guide-line"></div>
          </div>
          <div className="signature-actions">
            <Button variant="secondary" onClick={handleClear} disabled={isSaving}>
              Limpiar firma
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!hasSignature || isSaving}
              loading={isSaving}
            >
              Firmar contrato
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
