import {Component} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {filter, finalize, from, mergeMap, tap} from 'rxjs';
import {CategoryModalComponent} from "../../category/category-modal/category-modal.component";
import {ActionSheetService} from '../../shared/service/action-sheet.service';
import {ExpenseService} from "../expense.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Category, Expense} from "../../shared/domain";
import {CategoryService} from "../../category/category.service";
import {ToastService} from "../../shared/service/toast.service";
import {formatISO, parseISO} from "date-fns";

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent {
  readonly expenseForm: FormGroup;
  submitting = false;
  categories: Category[] = [];
  expense: Expense = {} as Expense;
  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly modalCtrl: ModalController,
    private readonly formBuilder: FormBuilder,
    private readonly expenseService: ExpenseService,
    private readonly categoryService: CategoryService,
    private readonly toastService: ToastService
) {
    this.expenseForm = this.formBuilder.group({
      id: [], // hidden
      categoryId: [],
      name: ['', [Validators.required, Validators.maxLength(40)]],
      amount: [Validators.min(0.01)],
      date: [formatISO(new Date())]

    });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.submitting = true;
    this.expenseService
      .upsertExpense({
        ...this.expenseForm.value,
        date: formatISO(parseISO(this.expenseForm.value.date), { representation: 'date' }),
      })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Expense saved');
          this.modalCtrl.dismiss(null, 'refresh');
        },
        error: (error) => this.toastService.displayErrorToast('Could not save Expense', error),
      });
  }

  delete(): void {
    from(this.actionSheetService.showDeletionConfirmation('Are you sure you want to delete this expense?'))
      .pipe(
        filter((action) => action === 'delete'),
        tap(() => (this.submitting = true)),
        mergeMap(() => this.expenseService.deleteExpense(this.expense.id!)),
        finalize(() => (this.submitting = false)),
      )
      .subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Expense deleted');
          this.modalCtrl.dismiss(null, 'refresh');
        },
        error: (error) => this.toastService.displayErrorToast('Could not delete expense', error),
      });
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({ component: CategoryModalComponent });
    categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();
    console.log('role', role);
  }
  private loadAllCategories(): void {
    this.categoryService.getAllCategories({ sort: 'name,asc' }).subscribe({
      next: (categories) => (this.categories = categories),
      error: (error) => this.toastService.displayErrorToast('Could not load categories', error),
    });
  }
  ionViewWillEnter(): void {
    this.loadAllCategories();
    const { id, amount, category, date, name } = this.expense;
    if (category) this.categories.push(category);
    if (id) this.expenseForm.patchValue({ id, amount, categoryId: category?.id, date, name });
  }
}
