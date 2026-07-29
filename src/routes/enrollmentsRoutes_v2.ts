import { Router, type Request, type Response } from "express";
import {
    zCourseId,
    zCoursePostBody,
    zCoursePutBody,
    zEnrollmentBody,
} from "../libs/zodValidators.ts";

import type { Student, Course, CustomRequest } from "../libs/types.ts";

// import database
import { courses, DB, enrollments, students } from "../db/db.ts";
import { authenticateToken } from "../middlewares/authenMiddleware.ts";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.ts";

const router = Router();

router.get("/", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
        const user = req.user;

        if (user?.role === "ADMIN") {
            return res.status(200).json({
                ok: true,
                enrollments: DB.enrollments
            });
        }

        if (user?.role === "STUDENT") {
            const stdId = user.studentId;
            const filteredStd = DB.enrollments.filter((e) => e.studentId === stdId);

            // console.log(user);
            // console.log(filteredStd);


            return res.status(200).json({
                ok: true,
                enrollments: filteredStd,
            });
        }

    } catch (err) {
        return res.status(200).json({
            ok: false,
            message: "Something is wrong, please try again",
            error: err,
        });
    }
});

router.post("/", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
        const user = req.user;
        const body = req.body;
        if (user?.role !== "STUDENT") {
            return res.status(403).json({
                ok: false,
                message: "Only Student can access this API route",
            });
        }

        const validation = zEnrollmentBody.safeParse(body);

        if (!validation.success) {
            return res.status(400).json({
                ok: false,
                message: validation.error.issues[0]?.message,
            });
        }
        
        const { studentId, courseId } = validation.data;

        const foundStudentId = DB.students.find((e) => e.studentId === studentId);

        const foundCourseId = DB.courses.find((e) => e.courseId === courseId);

        if (!foundStudentId) {
            return res.status(404).json({
                ok: false,
                message: "StudentId not found",
            });
        }

        if (!foundCourseId) {
            return res.status(404).json({
                ok: false,
                message: "CourseId not found",
            });
        }
        
        const alreadyEnrolled = DB.enrollments.find(
            (e) => e.studentId === studentId && e.courseId === courseId,
        );

        if (alreadyEnrolled) {
            return res.status(409).json({ ok: false, message: "Already enrolled in this course" });
        }

        DB.enrollments.push({ studentId, courseId });

        if (!foundStudentId.courses) {
            foundStudentId.courses = [];
        }

        foundStudentId.courses.push(courseId);

        return res.status(200).json({
            ok: true,
            message: "Enrollment successful",
            data: { studentId, courseId },
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something is wrong, please try again",
            error: err,
        });
    }
});

router.delete("/", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
        const user = req.user;
        const { courseNo } = req.body;

        if (user?.role !== "STUDENT") {
            return res.status(403).json({
                ok: false,
                message: "Only Student can access this API route",
            });
        }

        if (!courseNo) {
            return res.status(400).json({
                ok: false,
                message: "courseNo is required",
            });
        }

        const foundIdx = DB.enrollments.findIndex((e) => e.courseId === courseNo && e.studentId === user.studentId);

        if (foundIdx === -1) {
            return res.status(404).json({
                ok: false,
                message: "Enrollment not found",
            });
        }

        DB.enrollments.splice(foundIdx, 1);

        const std = DB.students.find((s) => s.studentId === user.studentId);

        if (std && !std.courses) {
            std.courses = [];
        } else if (std && std.courses) {
            std.courses = std.courses.filter((c) => c !== courseNo);
        }

        return res.status(200).json({
            ok: true,
            message: "You has dropped from this course. See you next semester."
        });

        
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something is wrong, please try again",
            error: err,
        });
    }
});


export default router;