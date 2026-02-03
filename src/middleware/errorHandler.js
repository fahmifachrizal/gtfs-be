export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Multer file-size rejection → 413 Payload Too Large
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            status: false,
            errorMessage: 'File too large. Maximum allowed size is 50 MB.',
            errorTitle: 'Payload Too Large'
        });
    }

    const statusCode = err.status || 500;
    const errorMessage = err.message || 'Internal Server Error';
    const errorTitle = err.name || 'Server Error';

    res.status(statusCode).json({
        status: false,
        errorMessage,
        errorTitle
    });
};
