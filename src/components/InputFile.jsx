import React, { useState, useEffect } from "react";
import { ALLOWED_FILE_TYPE, WEBP_FILE, fileTypes } from "./constants";

const InputFile = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [resolution, setResolution] = useState({});

  useEffect(() => {
    addResolutionToPrototype();
  }, []);

  useEffect(() => {
    const fetchDimensions = async () => {
      for (const file of selectedFiles) {
        if (webpFileType(file)) {
          const dimensions = await file.getResolution(file);
          setResolution((prevDimensions) => ({
            ...prevDimensions,
            [file.name]: dimensions,
          }));
        }
      }
    };

    fetchDimensions();
  }, [selectedFiles]);

  const handleFileChange = (event) => {
    /** element HTMLInputElement.files property, is a FileList object
     * a list of File objects which is an array */
    const files = Array.from(event.target.files);
    console.log(files);
    setSelectedFiles(files);
  };

  const handleFileLoad = async (file) => {
    const dimensions = await file.getResolution(file);
    setResolution((prevDimensions) => ({
      ...prevDimensions,
      [file.name]: dimensions,
    }));

    console.log(file.type);
  };

  const validFileType = (file) => {
    return fileTypes.includes(file.type);
  };

  const webpFileType = (file) => {
    return WEBP_FILE.includes(file.type);
  };

  const returnFileSize = (number) => {
    const bytes = number;
    const kilobytes = bytes / 1024;
    const megabytes = kilobytes / 1024;
    const gigabytes = megabytes / 1024;

    if (gigabytes >= 1) {
      return gigabytes.toFixed(1) + "GB";
    } else if (megabytes >= 1) {
      return megabytes.toFixed(1) + "MB";
    } else if (kilobytes >= 1) {
      return kilobytes.toFixed(1) + "KB";
    } else {
      return bytes + "bytes";
    }
  };

  const addResolutionToPrototype = () => {
    // Add File prototype with a getResolution function
    File.prototype.getResolution = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              width: img.width,
              height: img.height,
            });
          };
          /** When read operation is finished, "readyState" becomes DONE,
           * "loadend" is triggered. then, the "result" attribute contains data as URL (base64 encoded string). */
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
  };

  const renderPreview = () => {
    if (selectedFiles.length === 0) {
      return <p>No files currently selected for upload</p>;
    } else {
      return (
        <ul className="flex items-center justify-evenly">
          {selectedFiles.map((file) => (
            <li key={file.name} className="">
              {validFileType(file) ? (
                <>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    // onLoad={() => handleFileLoad(file)}
                    className="h-32 w-auto"
                  />

                  <p> {file.name}</p>
                  <p> {returnFileSize(file.size)}</p>
                  {resolution[file.name] && (
                    <p>
                      {`${resolution[file.name]?.width}px X ${
                        resolution[file.name]?.height
                      }px`}
                    </p>
                  )}
                </>
              ) : (
                <p>File name {file.name}: Not a webp file type.</p>
              )}
            </li>
          ))}
        </ul>
      );
    }
  };

  return (
    <div className="text-center">
      <div className="m-4">
        <label htmlFor="image_uploads">
          Choose images to upload (.jpg, .jpeg, .png, .bmp, .webp)
        </label>
        <input
          type="file"
          id="image_uploads"
          name="image_uploads"
          accept={ALLOWED_FILE_TYPE}
          onChange={handleFileChange}
          multiple
        />
      </div>
      <div className="preview">{renderPreview()}</div>
    </div>
  );
};

export default InputFile;
