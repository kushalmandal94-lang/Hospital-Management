const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Protect routes - requires authentication
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.status !== 'active') {
      return res.status(403).json({ message: 'User account is not active' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized to access this route', error: error.message });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Aliases for the requested naming convention
exports.verifyToken = exports.protect;
exports.authorizeRoles = (...roles) => exports.authorize(...roles);

// Activity logging middleware
exports.logActivity = (module, action) => {
  return async (req, res, next) => {
    // Log after response is sent
    const originalJson = res.json;
    res.json = function (body) {
      // Don't log failed auth requests
      if (req.user) {
        ActivityLog.create({
          userId: req.user._id,
          userRole: req.user.role,
          action,
          module,
          entityId: req.params.id || req.body._id,
          details: {
            method: req.method,
            path: req.path,
            body: req.body,
            params: req.params,
            query: req.query,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: res.statusCode < 400 ? 'success' : 'failure',
          errorMessage: body.message || null,
        }).catch((err) => console.error('Activity log error:', err));
      }
      return originalJson.call(this, body);
    };

    next();
  };
};
