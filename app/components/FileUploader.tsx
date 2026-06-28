import {useState, useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import { formatSize } from '../lib/utils'

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0] || null;

        onFileSelect?.(file);
    }, [onFileSelect]);

    const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes

    const {getRootProps, getInputProps, isDragActive, acceptedFiles} = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/pdf': ['.pdf']},
        maxSize: maxFileSize,
    })

    const file = acceptedFiles[0] || null;



    return (
        <div className="w-full gradient-border">
            <div {...getRootProps()}>
                <input {...getInputProps()} />

                <div className="space-y-4 cursor-pointer">
                    {file ? (
                        <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 border border-emerald-200 rounded-xl relative" onClick={(e) => e.stopPropagation()}>
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                <span className="text-emerald-600 text-2xl font-bold">✔</span>
                            </div>
                            <h3 className="text-lg font-bold text-emerald-800 mb-1">Resume Uploaded Successfully</h3>
                            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-emerald-100 flex items-center space-x-3 w-full max-w-sm mt-3">
                                <img src="/images/pdf.png" alt="pdf" className="w-8 h-8" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button className="absolute top-3 right-3 p-2 bg-white rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm" onClick={(e) => {
                                onFileSelect?.(null)
                            }}>
                                <img src="/icons/cross.svg" alt="remove" className="w-3 h-3 opacity-70" />
                            </button>
                        </div>
                    ): (
                        <div>
                            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                                <img src="/icons/info.svg" alt="upload" className="size-20" />
                            </div>
                            <p className="text-sm text-gray-500">
                                <span className="font-semibold">
                                    Click to upload
                                </span> or drag and drop
                            </p>
                            <p className="text-sm text-gray-500">PDF (max {formatSize(maxFileSize)})</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default FileUploader
