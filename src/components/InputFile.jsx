import React, { useState, useEffect, useRef } from "react";
import { ALLOWED_FILE_TYPE, TOKEN, WEBP_FILE, fileTypes } from "./constants";
import axios from "axios";

const InputFile = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [resolution, setResolution] = useState({});

  const canvasRef = useRef(null);

  const handleFileChange = (event) => {
    /** element HTMLInputElement.files property, is a FileList object
     * a list of File objects which is an array */
    const files = Array.from(event.target.files);
    console.log(files);

    setSelectedFiles(files);
  };

  useEffect(() => {
    addResolutionToPrototype();
  }, []);

  /**get the image dimension after loading image */
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

  /** Get the Canvas ref and put the image on canvas */

  const convertToJpeg = () => {
    selectedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const image = new Image();
        image.onload = () => {
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");

          canvas.width = image.width;
          canvas.height = image.height;

          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          // const jpegDataURL = canvas.toDataURL("image/jpeg");

          let quality = 1;
          convertToBlobURL(canvas, file, (quality = 1));
        };
        image.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  };

  const convertToBlobURL = (canvas, file, quality) => {
    canvas.toBlob(
      (blob) => {
        console.time("time taken");
        if (blob) {
          // check if the file size is greater than 1MB
          console.log("size: ", returnFileSize(blob.size));

          if (isFileSizeGreater(blob.size)) {
            quality = quality - 0.1;
            convertToBlobURL(canvas, file, quality);
          }
          console.timeEnd("time taken");

          if (!isFileSizeGreater(blob.size)) {
            // Create a temporary URL for the Blob
            const blobURL = URL.createObjectURL(blob);

            // Create a temporary link element
            /**download attribute means target will be downloaded
             * when a user clicks on the hyperlink*/
            const downloadLink = document.createElement("a");
            downloadLink.href = blobURL;
            downloadLink.download = removeExtension(file) + ".jpeg";

            // Simulate a click event to trigger the download
            downloadLink.click();

            /**Uploading the Blob file to backend API */
            uploadImgToApi(blob);

            // Clean up the temporary URL
            URL.revokeObjectURL(blobURL);
          }
        }
      },
      "image/jpeg",
      quality
    );
  };

  useEffect(() => {
    convertToJpeg();
  }, [selectedFiles]);

  const uploadImgToApi = async (blob) => {
    const config = {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "multipart/form-data",
      },
    };

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("type", "img");

    const payload = {
      url: "https://api-qa.shadowchef.co/v1/upload",
      method: "post",
      data: formData,
      headers: config.headers,
    };

    try {
      const response = await axios(payload);

      console.log("The response data: ", response.data);
    } catch (error) {
      console.error(error);
      console.warn(error.response);
    }
  };

  const isBlobImage = (image) => {
    return image instanceof Blob;
  };

  const returnFileSize = (bytes) => {
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

  const validFileType = (file) => {
    return fileTypes.includes(file.type);
  };

  const webpFileType = (file) => {
    return WEBP_FILE.includes(file.type);
  };

  const isFileSizeGreater = (bytes) => {
    const megabytes = bytes / (1024 * 1024);

    return megabytes >= 1;
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

  const removeExtension = (file) => {
    return file.name.replace(/\.[^/.]+$/, "");
  };

  const renderPreview = () => {
    if (selectedFiles.length === 0) {
      return <p></p>;
    } else {
      return (
        <ul className="flex items-center justify-evenly flex-wrap">
          {selectedFiles.map((file) => (
            <li key={file.name} className="w-auto p-3">
              {webpFileType(file) ? (
                <>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    // onLoad={() => handleFileLoad(file)}
                    className="h-32 w-auto m-auto"
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
      <div className="border-2 border-gray-500 border-dashed px-6 pt-2 pb-3 mx-72 my-3">
        <label
          className="block text-sm font-medium text-gray-800"
          htmlFor="image_uploads"
        >
          Upload Image
        </label>
        <input
          type="file"
          id="image_uploads"
          name="image_uploads"
          accept={ALLOWED_FILE_TYPE}
          onChange={handleFileChange}
          multiple
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg
                 cursor-pointer bg-gray-50 dark:text-gray-200 focus:outline-none dark:bg-gray-500
                  dark:border-gray-600 dark:placeholder-gray-400"
        />
        <p className="text-xs text-gray-900 mt-1" id="image_uploads_hint">
          {ALLOWED_FILE_TYPE}
        </p>
      </div>

      <div className="preview">{renderPreview()}</div>
      <div>
        <canvas ref={canvasRef} className="mx-auto h-1/2 w-1/2"></canvas>
      </div>
    </div>
  );
};

export default InputFile;
