"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import uploadImage from "@/assets/icons/upload.svg";
import { showToast } from "@/lib/toast";

interface FileUploadCardProps {
  onFileSelect?: (file: File | null) => void;
  onFilesSelect?: (files: File[]) => void; // For multiple file uploads
  acceptedFileTypes: string; // e.g. ".pdf,.doc,.docx" or "image/*"
  maxSizeMB?: number;
  title?: string;
  description?: string;
  initialFile?: File | null;
  initialFiles?: File[]; // For multiple files
  multiple?: boolean; // Enable multiple file selection
  className?: string;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({
  onFileSelect,
  onFilesSelect,
  acceptedFileTypes,
  maxSizeMB = 5,
  title = "Drag and drop your file",
  description = "or browse to choose a file",
  initialFile = null,
  initialFiles = [],
  multiple = false,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(initialFile);
  const [files, setFiles] = useState<File[]>(initialFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create a readable file size format string
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImage = (fileType: string): boolean => {
    return fileType.startsWith("image/");
  };

  const isPDF = (fileType: string): boolean => {
    return fileType === "application/pdf";
  };

  // Preview component for image files
  const ImagePreview = ({ file }: { file: File }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    React.useEffect(() => {
      if (!isImage(file.type)) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      return () => {
        reader.abort();
      };
    }, [file]);

    return previewUrl ? (
      <div className="relative w-12 h-12 mr-3">
        <Image
          src={previewUrl}
          alt="Preview"
          fill
          className="object-cover rounded"
        />
      </div>
    ) : null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (multiple && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processMultipleFiles(Array.from(e.dataTransfer.files));
    } else if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (multiple && e.target.files && e.target.files.length > 0) {
      processMultipleFiles(Array.from(e.target.files));
    } else if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    // Check file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      showToast.error(`File size should not exceed ${maxSizeMB}MB.`);
      return;
    }

    setFile(selectedFile);
    onFileSelect?.(selectedFile);
  };

  const processMultipleFiles = (selectedFiles: File[]) => {
    // Check file sizes
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSizeMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showToast.error(`Some files exceed the ${maxSizeMB}MB limit and were not added.`);
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);
    if (onFilesSelect) {
      onFilesSelect(newFiles);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onFileSelect?.(null);
  };

  const handleRemoveMultipleFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (onFilesSelect) {
      onFilesSelect(newFiles);
    }
  };

  const handleClearAllFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onFilesSelect) {
      onFilesSelect([]);
    }
  };

  // Extract file type description from the accepted types
  const getFileTypeDescription = () => {
    if (acceptedFileTypes === "image/*") return "Images";
    if (acceptedFileTypes.includes(".pdf")) return "PDF, DOC, DOCX";
    return acceptedFileTypes.replace(/\./g, "").toUpperCase();
  };

  return (
    <div
      className={`border-dashed border-2 ${
        isDragging ? "border-[#6155F5] bg-blue-50" : "border-gray-300"
      } rounded-lg p-2 pb-4 flex flex-col items-center justify-center transition-colors ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {multiple ? (
        // Multiple files view
        files.length === 0 ? (
          <>
            <Image
              src={uploadImage}
              alt="Upload"
              width={60}
              height={60}
              className="mb-1"
            />
            <p className="text-[#1A1A1A] text-lg font-medium text-center mb-1">
              {title}
            </p>
            <p className="text-[#4D4D4D] text-sm text-center mb-1">
              or{" "}
              <span
                className="text-[#6155F5] font-medium cursor-pointer hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </span>{" "}
              {description}
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: {getFileTypeDescription()} (Max {maxSizeMB}MB each)
            </p>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              className="hidden"
            />
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">
                {files.length} file{files.length !== 1 ? 's' : ''} uploaded
              </p>
              <button
                type="button"
                onClick={handleClearAllFiles}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center overflow-hidden flex-1">
                    {isImage(file.type) ? (
                      <ImagePreview file={file} />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 text-[#6155F5] flex-shrink-0"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    )}
                    <div className="overflow-hidden">
                      <div className="font-medium text-[#1A1A1A] truncate max-w-[180px]">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Remove file"
                    onClick={() => handleRemoveMultipleFile(index)}
                    className="text-gray-500 hover:text-red-500 flex-shrink-0 ml-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-sm text-[#6155F5] font-medium hover:underline"
            >
              + Add more files
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              className="hidden"
            />
          </div>
        )
      ) : (
        // Single file view (existing logic)
        !file ? (
          <>
            <Image
              src={uploadImage}
              alt="Upload"
              width={60}
              height={60}
              className="mb-1"
            />
            <p className="text-[#1A1A1A] text-lg font-medium text-center mb-1">
              {title}
            </p>
            <p className="text-[#4D4D4D] text-sm text-center mb-1">
              or{" "}
              <span
                className="text-[#6155F5] font-medium cursor-pointer hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </span>{" "}
              {description}
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: {getFileTypeDescription()} (Max {maxSizeMB}MB)
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              className="hidden"
            />
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center overflow-hidden">
                {isImage(file.type) ? (
                  <ImagePreview file={file} />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 text-[#6155F5]"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                )}
                <div className="overflow-hidden">
                  <div className="font-medium text-[#1A1A1A] truncate max-w-[180px]">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <button
                title="Remove file"
                onClick={handleRemoveFile}
                className="text-gray-500 hover:text-red-500 flex-shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-[#6155F5] h-1.5 rounded-full w-full"></div>
            </div>
            <p className="text-xs text-right mt-1 text-gray-500">
              Upload complete
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default FileUploadCard;
