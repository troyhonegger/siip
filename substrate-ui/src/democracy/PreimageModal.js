import React, { useState, useCallback } from 'react';
import { Button, Modal } from 'semantic-ui-react';
import { useDropzone } from 'react-dropzone';

import { useSubstrate } from '../substrate-lib';
import { TxButton } from '../substrate-lib/components';
import { STATUS } from '../substrate-lib/components/TxButton';
import classNames from 'classnames';

const NewPreimageModal = ({ accountPair }) => {
  const [isOpen, setOpen] = useState(false);
  const [preimage, setPreimage] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const setClose = () => {
    setOpen(false);
    setPreimage(null);
    setTxStatus(null);
  };
  const setStatus = status => {
    setTxStatus(status);
    if (status === STATUS.IN_BLOCK || status === STATUS.READY) {
      setClose();
    }
  };

  const { api } = useSubstrate();
  const proposal = preimage && api._extrinsics.system.setCode(preimage);
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onabort = () => console.log('file reading was aborted');
    reader.onerror = () => console.log('file reading has failed');
    reader.onload = () => {
      const binaryStr = reader.result;
      setPreimage(binaryStr);
    };
    reader.readAsArrayBuffer(file);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });
  return (
    <Modal open={isOpen} onOpen={() => setOpen(true)}
      trigger={<Button className="green">New Preimage</Button>}
    >
      <Modal.Header>
        Submit Preimage for Runtime Upgrade
      </Modal.Header>
      <Modal.Content>

        {proposal && (
          <>
          <h3>Preimage hash: </h3> <span>{proposal.hash.toHuman()}</span>
          </>
        )}
        <h3>Upload new runtime:</h3>
        <div className={classNames('file-drop', { 'drag-active': isDragActive })} {...getRootProps()}>
          <input {...getInputProps()} />
          Drag and drop file here or click to upload
        </div>

      </Modal.Content>
      <Modal.Actions>
        <Button className="red" onClick={setClose}>Cancel</Button>
        <TxButton
          label='Submit Preimage'
          type='SIGNED-TX'
          accountPair={accountPair}
          setStatus={setStatus}
          disabled={txStatus === STATUS.SENDING}
          attrs={{
            palletRpc: 'democracy',
            callable: 'notePreimage',
            inputParams: [proposal?.method.toHex()],
            paramFields: [{ name: 'proposal', type: 'Bytes', optional: false }],
            interxType: 'EXTRINSIC',
            disabled: proposal == null
          }}
        />
      </Modal.Actions>
    </Modal>
  );
};

export default NewPreimageModal;
