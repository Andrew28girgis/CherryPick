import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  TemplateRef,
  Renderer2,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy,
  NgZone,
  HostListener,
  EventEmitter,
  Output,
  Pipe,
  PipeTransform,
} from "@angular/core"
import { ActivatedRoute } from "@angular/router"
import { NgbModal } from "@ng-bootstrap/ng-bootstrap"
import { BuyboxCategory } from "src/app/shared/models/buyboxCategory"
import { Center, Reaction, Stage } from "../../../../shared/models/shoppingCenters"
import { General } from "src/app/shared/models/domain"
import { trigger, style, animate, transition, keyframes } from "@angular/animations"
import { Subscription } from "rxjs"
import { ViewManagerService } from "src/app/core/services/view-manager.service"
import { PlacesService } from "src/app/core/services/places.service"
import { NgxSpinnerService } from "ngx-spinner"
import { AuthService } from "src/app/core/services/auth.service"

@Pipe({
  name: 'filterReplies',
  pure: true
})
export class FilterRepliesPipe implements PipeTransform {
  transform(comments: any[] | undefined | null, parentId: number): any[] {
    if (!comments) return [];
    return comments.filter(comment => comment.ParentCommentId === parentId);
  }
}

@Component({
  selector: "app-social-view",
  templateUrl: "./social-view.component.html",
  styleUrls: ["./social-view.component.css"],
  animations: [
    trigger("heartAnimation", [
      transition(":enter", [
        animate(
          "3s cubic-bezier(0.17, 0.89, 0.32, 1.28)",
          keyframes([
            style({
              transform: "scale(0)",
              opacity: 0,
              offset: 0,
            }),
            style({
              transform: "scale(1.2)",
              opacity: 0.9,
              offset: 0.15,
            }),
            style({
              transform: "scale(1)",
              opacity: 1,
              offset: 0.3,
            }),
            style({
              transform: "scale(1.1) translateY(-40px)",
              opacity: 1,
              offset: 0.5,
            }),
            style({
              transform: "scale(1) translateY(-80px)",
              opacity: 0.9,
              offset: 0.7,
            }),
            style({
              transform: "scale(0.8) translateY(-120px)",
              opacity: 0,
              offset: 1,
            }),
          ]),
        ),
      ]),
    ]),
  ],
})
export class SocialViewComponent implements OnInit, AfterViewInit, OnDestroy {
  currentUserName: string = '';
  currentUserImage: string = '';
  
  @ViewChild("commentsContainer") commentsContainer: ElementRef | undefined
  @Output() viewChange = new EventEmitter<number>()
  
  // Properties used in template
  isLoading = true
  filteredCenters: Center[] = []
  showComments: { [key: number]: boolean } = {}
  showDetails: boolean[] = []
  replyingTo: { [key: number]: number | null } = {}
  newComments: { [key: number]: string } = {}
  newReplies: { [key: number]: string } = {}
  likedShoppings: { [key: number]: boolean } = {}
  isLikeInProgress = false
  heartVisible = false
  heartX = 0
  heartY = 0
  isMobileView = false
  
  // Core data
  shoppingCenters: Center[] = []
  stages: Stage[] = []
  selectedStageId = 0
  selectedStageName = "All"
  General: General = new General()
  BuyBoxId!: any
  OrgId!: any
  BuyBoxName!: string
  
  // Properties used in subscriptions
  buyboxCategories: BuyboxCategory[] = []
  ShareOrg: any = null
  buyboxPlaces: any[] = []
  selectedId: number | null = null
  selectedIdCard: number | null = null
  mapsLoaded = false

  private clickTimeout: any
  private heartTimeout: any
  private lastClickTime = 0
  private readonly DOUBLE_CLICK_THRESHOLD = 300
  private subscriptions = new Subscription()
  private commentSortCache = new WeakMap<any[], any[]>()

  showAllComments: { [key: number]: boolean } = {}
  showAllReplies: { [key: number]: boolean } = {}

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private PlacesService: PlacesService,
    private ngZone: NgZone,
    private shoppingCenterService: ViewManagerService,
    private spinner: NgxSpinnerService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkMobileView()
    this.General = new General()
    this.loadCurrentUser()

    // Subscribe to the selectedStageId from the service
    this.subscriptions.add(
      this.shoppingCenterService.selectedStageId$.subscribe((id) => {
        this.selectedStageId = id
        // Update the selected stage name for display
        if (id === 0) {
          this.selectedStageName = "All"
        } else {
          const stage = this.stages.find((s) => s.id === this.selectedStageId)
          this.selectedStageName = stage ? stage.stageName : ""
        }
        this.cdr.detectChanges()
      }),
    )

    // Subscribe to filtered centers which will already be sorted
    this.subscriptions.add(
      this.shoppingCenterService.filteredCenters$.subscribe((centers) => {
        this.filteredCenters = centers;
        this.cdr.detectChanges();
      })
    );

    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid
      this.OrgId = params.orgId
      this.BuyBoxName = params.buyboxName
      localStorage.setItem("BuyBoxId", this.BuyBoxId)
      localStorage.setItem("OrgId", this.OrgId)
    })

    // Subscribe to data from the centralized service
    this.subscriptions.add(
      this.shoppingCenterService.isLoading$.subscribe((loading) => {
        this.isLoading = loading
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.shoppingCenters$.subscribe((centers) => {
        this.shoppingCenters = centers
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.buyboxCategories$.subscribe((categories) => {
        this.buyboxCategories = categories
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.shareOrg$.subscribe((org) => {
        this.ShareOrg = org
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.buyboxPlaces$.subscribe((places) => {
        this.buyboxPlaces = places
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.selectedId$.subscribe((id) => {
        this.selectedId = id
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.selectedIdCard$.subscribe((id) => {
        this.selectedIdCard = id
        this.cdr.detectChanges()
      }),
    )

    setTimeout(() => {
      this.mapsLoaded = true
      this.cdr.markForCheck()
    }, 2000)

    window.addEventListener("resize", this.checkMobileView.bind(this))
  }

  ngAfterViewInit(): void {
    // No need for global click listener setup since we're not using it
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
    window.removeEventListener("resize", this.checkMobileView.bind(this))
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout)
    }
    if (this.heartTimeout) {
      clearTimeout(this.heartTimeout)
    }
  }


  toggleDetails(index: number, shopping: any): void {
    if (shopping.ShoppingCenter?.BuyBoxPlaces) {
      this.showDetails[index] = !this.showDetails[index]
      this.cdr.markForCheck()
    }
  }

  getNeareastCategoryName(categoryId: number): string {
    return this.shoppingCenterService.getNearestCategoryName(categoryId)
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    return this.shoppingCenterService.getShoppingCenterUnitSize(shoppingCenter)
  }

  toggleCommentsVisibility(shopping: any, event: MouseEvent): void {
    event.stopPropagation()
    this.showComments[shopping.Id] = !this.showComments[shopping.Id]
    this.cdr.markForCheck()
  }

  addComment(shopping: Center, marketSurveyId: number): void {
    if (!this.newComments[marketSurveyId]?.trim()) {
      return;
    }

    const commentText = this.newComments[marketSurveyId];
    this.newComments[marketSurveyId] = "";

    // Create new comment object with all required fields
    const newComment = {
      Id: Date.now(), // Temporary ID until server responds
      Comment: commentText,
      CommentDate: new Date().toISOString(),
      Firstname: localStorage.getItem('firstName') || '',
      Lastname: localStorage.getItem('lastName') || '',
      ParentCommentId: 0,
      MarketSurveyId: marketSurveyId
    };

    // Initialize Comments array if it doesn't exist
    if (!shopping.ShoppingCenter) {
      shopping.ShoppingCenter = {
        Comments: [],
        Places: [],
        Reactions: [],
        BuyBoxPlaces: [],
        ManagerOrganization: [],
        UserSubmmision: []
      };
    } else if (!shopping.ShoppingCenter.Comments) {
      shopping.ShoppingCenter.Comments = [];
    }

    // Add the comment to the UI immediately
    shopping.ShoppingCenter.Comments = [...shopping.ShoppingCenter.Comments, newComment];
    
    // Force change detection
    setTimeout(() => {
      this.cdr.detectChanges();
    });

    const body = {
      Name: "CreateComment",
      Params: {
        MarketSurveyId: shopping.MarketSurveyId,
        Comment: commentText,
        ParentCommentId: 0,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        if (response?.json?.id) {
          const index = shopping.ShoppingCenter.Comments.findIndex(c => c.Id === newComment.Id);
          if (index !== -1) {
            shopping.ShoppingCenter.Comments[index] = {
              ...shopping.ShoppingCenter.Comments[index],
              Id: response.json.id
            };
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {
        shopping.ShoppingCenter.Comments = shopping.ShoppingCenter.Comments.filter(c => c.Id !== newComment.Id);
        this.cdr.detectChanges();
      }
    });
  }

  addReply(marketSurveyId: number, commentId: number): void {
    if (!this.newReplies[commentId]?.trim()) {
      return;
    }

    const replyText = this.newReplies[commentId];
    this.newReplies[commentId] = "";

    const newReply = {
      Id: Date.now(),
      Comment: replyText,
      CommentDate: new Date().toISOString(),
      ParentCommentId: commentId,
      Firstname: localStorage.getItem('firstName') || '',
      Lastname: localStorage.getItem('lastName') || '',
      MarketSurveyId: marketSurveyId
    };

    const shoppingCenter = this.shoppingCenters.find((sc) => sc.MarketSurveyId === marketSurveyId);
    if (shoppingCenter) {
      // Initialize Comments array if it doesn't exist
      if (!shoppingCenter.ShoppingCenter) {
        shoppingCenter.ShoppingCenter = {
          Comments: [],
          Places: [],
          Reactions: [],
          BuyBoxPlaces: [],
          ManagerOrganization: [],
          UserSubmmision: []
        };
      } else if (!shoppingCenter.ShoppingCenter.Comments) {
        shoppingCenter.ShoppingCenter.Comments = [];
      }

      // Add the reply to the UI immediately
      shoppingCenter.ShoppingCenter.Comments = [...shoppingCenter.ShoppingCenter.Comments, newReply];
      this.replyingTo[marketSurveyId] = null;

      // Force change detection
      setTimeout(() => {
        this.cdr.detectChanges();
      });

      const body = {
        Name: "CreateComment",
        Params: {
          MarketSurveyId: marketSurveyId,
          Comment: replyText,
          ParentCommentId: commentId,
        },
      };

      this.PlacesService.GenericAPI(body).subscribe({
        next: (response: any) => {
          if (response?.json?.id) {
            const index = shoppingCenter.ShoppingCenter.Comments.findIndex(c => c.Id === newReply.Id);
            if (index !== -1) {
              shoppingCenter.ShoppingCenter.Comments[index] = {
                ...shoppingCenter.ShoppingCenter.Comments[index],
                Id: response.json.id
              };
            }
            this.cdr.detectChanges();
          }
        },
        error: () => {
          shoppingCenter.ShoppingCenter.Comments = shoppingCenter.ShoppingCenter.Comments.filter(c => c.Id !== newReply.Id);
          this.cdr.detectChanges();
        }
      });
    }
  }

  sortCommentsByDate(comments: any[]): any[] {
    if (!comments) return []

    if (this.commentSortCache.has(comments)) {
      return this.commentSortCache.get(comments)!
    }

    const sorted = [...comments].sort((a, b) => new Date(b.CommentDate).getTime() - new Date(a.CommentDate).getTime())

    this.commentSortCache.set(comments, sorted)
    return sorted
  }

  toggleReply(shopping: any, commentId: number): void {
    if (!this.replyingTo[shopping.MarketSurveyId]) {
      this.replyingTo[shopping.MarketSurveyId] = null
    }

    this.replyingTo[shopping.MarketSurveyId] = this.replyingTo[shopping.MarketSurveyId] === commentId ? null : commentId

    this.cdr.markForCheck()
  }

  trimComment(value: string, marketSurveyId: number): void {
    if (value) {
      this.newComments[marketSurveyId] = value.trimLeft()
    } else {
      this.newComments[marketSurveyId] = ""
    }
  }

  handleClick(shopping: any, likeTpl: TemplateRef<any> | null, index: number): void {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout)
      this.clickTimeout = null
      this.addLike(shopping, 1)
    } else {
      this.clickTimeout = setTimeout(() => {
        this.addLike(shopping, 1)
        this.clickTimeout = null
      }, 250)
    }
  }

  isDisliked(shopping: Center): boolean {
    if (!shopping?.ShoppingCenter?.Reactions) return false;
    const contactIdStr = localStorage.getItem("contactId");
    if (!contactIdStr) return false;
    
    const contactId = Number.parseInt(contactIdStr, 10);
    return shopping.ShoppingCenter.Reactions.some(
      reaction => reaction.ReactionId === 2 && reaction.ContactId === contactId
    );
  }

  addDislike(shopping: Center, reactionId: number): void {
    const contactIdStr = localStorage.getItem("contactId");
    if (!contactIdStr) return;
    
    const contactId = Number.parseInt(contactIdStr, 10);
    
    // If already disliked, don't do anything
    if (this.isDisliked(shopping)) {
      return;
    }

    if (!shopping.ShoppingCenter.Reactions) {
      shopping.ShoppingCenter.Reactions = [];
    }

    // Remove any existing like by the user
    if (this.isLiked(shopping)) {
      shopping.ShoppingCenter.Reactions = shopping.ShoppingCenter.Reactions.filter(
        reaction => !(reaction.ReactionId === 1 && reaction.ContactId === contactId)
      );
      this.likedShoppings[shopping.MarketSurveyId] = false;
    }

    // Add the dislike reaction immediately for UI update
    const newDislike = {
      ReactionId: reactionId,
      ContactId: contactId
    };
    shopping.ShoppingCenter.Reactions.push(newDislike);
    
    // Force change detection
    this.cdr.detectChanges();

    const body = {
      Name: "CreatePropertyReaction",
      Params: {
        MarketSurveyId: shopping.MarketSurveyId,
        ReactionId: reactionId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: () => {},
      error: () => {
        // Revert changes on error
        shopping.ShoppingCenter.Reactions = shopping.ShoppingCenter.Reactions.filter(
          reaction => !(reaction.ReactionId === reactionId && reaction.ContactId === contactId)
        );
        this.cdr.detectChanges();
      },
      complete: () => {
        this.cdr.detectChanges();
      },
    });
  }

  getLikeCount(reactions: any[] | undefined): number {
    if (!reactions) return 0;
    return reactions.filter(reaction => reaction.ReactionId === 1).length;
  }

  getDislikeCount(reactions: any[] | undefined): number {
    if (!reactions) return 0;
    return reactions.filter(reaction => reaction.ReactionId === 2).length;
  }

  addLike(shopping: Center, reactionId: number): void {
    const contactIdStr = localStorage.getItem("contactId");
    if (!contactIdStr) return;
    
    const contactId = Number.parseInt(contactIdStr, 10);

    // If already liked, don't do anything
    if (this.isLiked(shopping)) {
      return;
    }

    if (this.isLikeInProgress) {
      return;
    }

    if (!shopping.ShoppingCenter.Reactions) {
      shopping.ShoppingCenter.Reactions = [];
    }

    // Remove any existing dislike by the user
    if (this.isDisliked(shopping)) {
      shopping.ShoppingCenter.Reactions = shopping.ShoppingCenter.Reactions.filter(
        reaction => !(reaction.ReactionId === 2 && reaction.ContactId === contactId)
      );
    }

    // Add the like reaction immediately for UI update
    const newLike = {
      ReactionId: reactionId,
      ContactId: contactId
    };
    shopping.ShoppingCenter.Reactions.push(newLike);
    this.likedShoppings[shopping.MarketSurveyId] = true;

    // Force change detection
    this.cdr.detectChanges();

    const body = {
      Name: "CreatePropertyReaction",
      Params: {
        MarketSurveyId: shopping.MarketSurveyId,
        ReactionId: reactionId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: () => {},
      error: () => {
        // Revert changes on error
        shopping.ShoppingCenter.Reactions = shopping.ShoppingCenter.Reactions.filter(
          reaction => !(reaction.ReactionId === reactionId && reaction.ContactId === contactId)
        );
        this.likedShoppings[shopping.MarketSurveyId] = false;
        this.isLikeInProgress = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLikeInProgress = false;
        this.cdr.detectChanges();
      },
    });
  }

  isLiked(shopping: Center): boolean {
    if (!shopping?.ShoppingCenter?.Reactions) return false;
    const contactIdStr = localStorage.getItem("contactId");
    if (!contactIdStr) return false;
    
    const contactId = Number.parseInt(contactIdStr, 10);
    return shopping.ShoppingCenter.Reactions.some(
      reaction => reaction.ReactionId === 1 && reaction.ContactId === contactId
    );
  }

  trackByShoppingId(item: any): number {
    return item.Id
  }

  trackByCommentId(index: number, item: any): number {
    return item.Id || index
  }

  getReplies(comments: any[] | undefined | null, parentId: number): any[] {
    if (!comments) return [];
    return comments.filter(comment => comment.ParentCommentId === parentId);
  }

  @HostListener("window:resize", ["$event"])
  onResize() {
    this.checkMobileView()
  }

  checkMobileView(): void {
    this.isMobileView = window.innerWidth <= 768
    this.cdr.detectChanges()
  }

  loadStages(): void {
    const body = {
      Name: "GetKanbanTemplateStages",
      Params: { KanbanTemplateId: 6 },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.stages = res.json
          .map((s: any) => ({
            id: +s.id,
            stageName: s.stageName,
            stageOrder: +s.stageOrder,
            isQualified: s.isQualified,
            kanbanTemplateId: +s.kanbanTemplateId,
          }))
          .sort((a: Stage, b: Stage) => a.stageOrder - b.stageOrder)

        if (this.selectedStageId === 0) {
          this.selectedStageName = "All"
        } else {
          const current = this.stages.find((s) => s.id === this.selectedStageId)
          this.selectedStageName = current ? current.stageName : "Stage"
        }
        this.cdr.detectChanges()
      },
      error: (err) => console.error("Error loading kanban stages:", err),
    })
  }

  onStageChange(id: number) {
    this.selectedStageId = id
    this.shoppingCenterService.setSelectedStageId(id)
  }

  selectStagekan(id: number) {
    this.shoppingCenterService.setSelectedStageId(id)
  }

  handleContentDoubleClick(event: MouseEvent, shopping: Center): void {
    const clickTime = new Date().getTime()
    const timeDiff = clickTime - this.lastClickTime
    const contactIdStr = localStorage.getItem("contactId")
    if (!contactIdStr) {
      return
    }
    const contactId = Number.parseInt(contactIdStr ? contactIdStr : "0", 10)
    if (
      shopping.ShoppingCenter.Reactions &&
      shopping.ShoppingCenter.Reactions.some((reaction: Reaction) => reaction.ContactId === contactId)
    ) {
      return
    }
    if (timeDiff < this.DOUBLE_CLICK_THRESHOLD) {
      event.preventDefault()
      event.stopPropagation()
      this.heartX = event.clientX
      this.heartY = event.clientY
      if (!contactIdStr) {
        return
      }
      this.showHeartAnimation()
      this.addLike(shopping, 1)
      this.lastClickTime = 0
    } else {
      this.lastClickTime = clickTime
    }
  }

  showHeartAnimation(): void {
    this.ngZone.run(() => {
      if (this.heartTimeout) {
        clearTimeout(this.heartTimeout)
        this.heartTimeout = null
      }
      this.heartVisible = false
      this.cdr.detectChanges()
      setTimeout(() => {
        this.heartVisible = true
        this.cdr.detectChanges()
        this.heartTimeout = setTimeout(() => {
          this.heartVisible = false
          this.cdr.detectChanges()
        }, 3000)
      }, 10)
    })
  }

  toggleComments(marketSurveyId: number): void {
    this.showAllComments[marketSurveyId] = !this.showAllComments[marketSurveyId];
    this.cdr.detectChanges();
  }

  toggleReplies(commentId: number): void {
    this.showAllReplies[commentId] = !this.showAllReplies[commentId];
    this.cdr.detectChanges();
  }

  getTotalCommentsCount(comments: any[] | undefined | null): number {
    if (!comments) return 0;
    const parentComments = comments.filter(c => !c.ParentCommentId);
    const replies = comments.filter(c => c.ParentCommentId);
    return parentComments.length + replies.length;
  }

  getVisibleCommentsCount(marketSurveyId: number, comments: any[] | undefined | null): number {
    if (!comments) return 0;
    const sortedComments = this.sortCommentsByDate(comments.filter(c => !c.ParentCommentId));
    const visibleParentComments = this.showAllComments[marketSurveyId] ? sortedComments.length : Math.min(sortedComments.length, 3);
    
    let visibleRepliesCount = 0;
    sortedComments.slice(0, visibleParentComments).forEach(comment => {
      const replies = this.getReplies(comments, comment.Id);
      visibleRepliesCount += this.showAllReplies[comment.Id] ? replies.length : Math.min(replies.length, 2);
    });
    
    return visibleParentComments + visibleRepliesCount;
  }

  shouldShowMoreComments(shopping: any): boolean {
    if (!shopping?.ShoppingCenter?.Comments) return false;
    const totalCount = this.getTotalCommentsCount(shopping.ShoppingCenter.Comments);
    const visibleCount = this.getVisibleCommentsCount(shopping.MarketSurveyId, shopping.ShoppingCenter.Comments);
    return totalCount > visibleCount;
  }

  private loadCurrentUser() {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      this.currentUserName = user.firstName || user.FirstName || '';
      this.currentUserImage = user.profileImage || user.ProfileImage || '';
    }
  }
}
