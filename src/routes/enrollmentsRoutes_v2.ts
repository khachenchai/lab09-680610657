import { Router, type Request, type Response } from "express";
import {
    zCourseId,
    zCoursePostBody,
    zCoursePutBody,
    zEnrollmentBody,
} from "../libs/zodValidators.ts";

import type { Student, Course, CustomRequest } from "../libs/types.ts";

// import database
import { courses, enrollments, students } from "../db/db.ts";
import { authenticateToken } from "../middlewares/authenMiddleware.ts";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.ts";

const router = Router();

router.get("/", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
        const user = req.user;

        if (user?.role === "ADMIN") {
            return res.status(200).json({
                ok: true,
                enrollments
            });
        }

        if (user?.role === "STUDENT") {
            const stdId = user.studentId;
            const filteredStd = enrollments.filter((e) => e.studentId === stdId);

            console.log(user);
            console.log(filteredStd);


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

router.post("/", authenticateToken, checkRoleAdmin, (req: CustomRequest, res: Response) => {
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

        const checkedStudentId = students.find((e) => e.studentId === studentId);

        const checkedCourseId = courses.find((e) => e.courseId === courseId);

        if (!checkedStudentId) {
            return res.status(404).json({
                ok: false,
                message: "StudentId not found",
            });
        }

        if (!checkedCourseId) {
            return res.status(404).json({
                ok: false,
                message: "CourseId not found",
            });
        }
        
        const alreadyEnrolled = enrollments.find(
            (e) => e.studentId === studentId && e.courseId === courseId,
        );
        if (alreadyEnrolled)
            return res.status(409).json({ ok: false, message: "Already enrolled in this course" });

        enrollments.push({ studentId, courseId });

        //เคยลงวิชาไหม
        if (!checkedStudentId.courses) {
            checkedStudentId.courses = [];
        }
        checkedStudentId.courses.push(courseId);
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


export default router