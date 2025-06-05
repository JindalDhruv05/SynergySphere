import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { format } from 'date-fns';

export default function ProjectDocuments({ projectId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/project-documents/project/${projectId}/documents`);
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to load project documents');
      console.error('Error fetching project documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    try {
      setUploading(true);
      
      // First upload the file to get a document ID
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', fileName || file.name);
      
      const uploadResponse = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Then link the document to the project
      await api.post(`/project-documents/project/${projectId}/documents`, {
        documentId: uploadResponse.data._id
      });
      
      // Refresh document list
      fetchDocuments();
      setIsUploadModalOpen(false);
      setFile(null);
      setFileName('');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Failed to upload document');
      console.error('Error uploading document:', err);
    } finally {
      setUploading(false);
    }
  };
  const handleViewDocument = (doc) => {
    // For PDFs and documents, open in new tab
    if (doc.resourceType === 'raw' || doc.mimeType === 'application/pdf') {
      window.open(doc.url, '_blank');
    } else {
      // For images and videos, open directly
      window.open(doc.url, '_blank');
    }
  };
  const handleDownloadDocument = async (doc) => {
    try {
      // Get download URL from backend
      const response = await api.get(`/documents/${doc._id}/urls`);
      const { downloadUrl } = response.data;
      
      // Create temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl || doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
      // Fallback to direct URL
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRemoveDocument = async (documentId) => {
    try {
      await api.delete(`/project-documents/project/${projectId}/documents/${documentId}`);
      setDocuments(documents.filter(doc => doc._id !== documentId));
    } catch (err) {
      setError('Failed to remove document');
      console.error('Error removing document:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Project Documents</h2>
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Upload Document
        </Button>
      </div>
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading a document.</p>
          <div className="mt-6">
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload Document
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {documents.map((document) => (
              <li key={document._id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{document.name}</div>
                      <div className="text-xs text-gray-500">
                        <span>Uploaded by {document.uploadedBy?.name || 'Unknown'} • </span>
                        <span>{format(new Date(document.uploadedAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDocument(document)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(document)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Download
                    </button>
                    <Button
                      onClick={() => handleRemoveDocument(document._id)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-500 hover:bg-gray-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}      {/* Upload Document Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Document" maxWidth="lg">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  {file ? file.name : 'PNG, JPG, PDF, DOCX up to 10MB'}
                </p>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="file-name" className="block text-sm font-medium text-gray-700">
              Document Name (Optional)
            </label>
            <input
              type="text"
              id="file-name"
              className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter document name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row-reverse gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={!file || uploading}
              className="flex-1 sm:flex-none"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
