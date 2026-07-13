import { Request, Response } from "express";
import { ok } from "../../utils/response";
import * as categoriesService from "./categories.service";

export async function list(req: Request, res: Response) {
  ok(res, await categoriesService.listCategories());
}

export async function getById(req: Request, res: Response) {
  ok(res, await categoriesService.getCategory(req.params.id as string));
}

export async function create(req: Request, res: Response) {
  ok(res, await categoriesService.createCategory({ name: req.body.name, nameAr: req.body.nameAr }), 201);
}

export async function update(req: Request, res: Response) {
  ok(
    res,
    await categoriesService.updateCategory(req.params.id as string, {
      name: req.body.name,
      nameAr: req.body.nameAr,
    })
  );
}

export async function remove(req: Request, res: Response) {
  await categoriesService.deleteCategory(req.params.id as string);
  ok(res, { deleted: true });
}
