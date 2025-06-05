import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function ConfirmDoneModal({ isOpen, onClose, onConfirm, taskTitle }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Task Completion" maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              Complete Task
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Are you sure you want to mark "{taskTitle}" as Done?
            </p>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h4 className="text-sm font-medium text-amber-800">
                Important Notice
              </h4>
              <p className="mt-1 text-sm text-amber-700">
                Once confirmed, this task cannot be changed back from "Done" status. This action is permanent.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
          >
            Confirm Complete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
