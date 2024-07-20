const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.register = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  const correct = await user.correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  const token = signToken(user.id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in.'), 401);
  }

  let currentUser;
  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The token belonging to this user does not longer exist.', 401));
    }

    req.user = currentUser;
    
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('User recently changed password.', 401));
    }
  } catch (err) {
    return next(new AppError('Invalid token.'), 401);
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({
    validateBeforeSave: false,
  });

  try {
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forget your password? Submit a PATCH request with your new password and 
    passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email.`;

    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email.',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    return next(new AppError('There was an error sending email, try again later.'), 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid token.'));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordChangedAt = Date.now();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  const token = signToken(user._id);

  req.status(200).json({
    status: 'success',
    token
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in.', 401));
  }

  let currentUser;
  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (userId !== req.params.id) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    currentUser = await User.findById(userId);

    if (!currentUser) {
      return next(new AppError('User not found.', 404));
    }

    const { oldPassword, newPassword, newPasswordConfirm } = req.body;

    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      return next(new AppError('Please provide old password, new password and new password confirm.', 400));
    }

    if (!(await currentUser.correctPassword(oldPassword, currentUser.password))) {
      return next(new AppError('Old password is incorrect.', 401));
    }

    if (newPassword !== newPasswordConfirm) {
      return next(new AppError('New passwords do not match.', 400));
    }

    currentUser.password = newPassword;
    currentUser.passwordConfirm = newPasswordConfirm;
    currentUser.passwordChangedAt = Date.now();
    currentUser.passwordResetToken = undefined;
    currentUser.passwordResetExpires = undefined;

    await currentUser.save();

    const newToken = signToken(currentUser._id);

    res.status(200).json({
      status: 'success',
      token: newToken
    });
  } catch (err) {
    return next(new AppError(err.message || 'Something went wrong.', 500));
  }
});