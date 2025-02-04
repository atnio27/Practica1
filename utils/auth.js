const allowedRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.redirect("/auth/login");
        }

        const user = req.session.user;

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
            return res.status(403).render("error", {
                title: "Forbidden",
                error: "Forbidden: Insufficient role privileges.",
                code: 403,
            });
        }

        req.user = user;

        next();
    };
};

// export { allowedRoles };
module.exports = allowedRoles;
