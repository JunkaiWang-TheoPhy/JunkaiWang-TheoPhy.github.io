import scrapy
import os
import re


class ArxivSpider(scrapy.Spider):
    CATEGORY_ALIASES = {
        "hepth": "hep-th",
        "hep-th": "hep-th",
        "hepex": "hep-ex",
        "hep-ex": "hep-ex",
        "grqc": "gr-qc",
        "gr-qc": "gr-qc",
        "mathph": "math-ph",
        "math-ph": "math-ph",
        "cmt": "cond-mat",
        "cond-mat": "cond-mat",
    }

    @classmethod
    def normalize_category(cls, raw):
        value = (raw or "").strip().lower().replace("_", "-")
        if not value:
            return ""
        compact = value.replace("-", "")
        if value in cls.CATEGORY_ALIASES:
            return cls.CATEGORY_ALIASES[value]
        if compact in cls.CATEGORY_ALIASES:
            return cls.CATEGORY_ALIASES[compact]
        return value

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        categories = os.environ.get("CATEGORIES", "hep-th,cond-mat,gr-qc,hep-ex,math-ph")
        categories = categories.split(",")
        normalized = [self.normalize_category(cat) for cat in categories]
        # 保存目标分类列表，用于后续验证
        self.target_categories = {cat for cat in normalized if cat}
        self.start_urls = [
            f"https://arxiv.org/list/{cat}/new" for cat in self.target_categories
        ]  # 起始URL（计算机科学领域的最新论文）

    name = "arxiv"  # 爬虫名称
    allowed_domains = ["arxiv.org"]  # 允许爬取的域名

    def matches_target_categories(self, paper_categories):
        for paper_category in paper_categories:
            normalized = self.normalize_category(paper_category)
            for target in self.target_categories:
                if normalized == target:
                    return True
                # Support broad classes such as cond-mat to match cond-mat.xxx
                if normalized.startswith(f"{target}."):
                    return True
        return False

    def parse(self, response):
        # 提取每篇论文的信息
        anchors = []
        for li in response.css("div[id=dlpage] ul li"):
            href = li.css("a::attr(href)").get()
            if href and "item" in href:
                anchors.append(int(href.split("item")[-1]))

        # 遍历每篇论文的详细信息
        for paper in response.css("dl dt"):
            paper_anchor = paper.css("a[name^='item']::attr(name)").get()
            if not paper_anchor:
                continue
                
            paper_id = int(paper_anchor.split("item")[-1])
            if anchors and paper_id >= anchors[-1]:
                continue

            # 获取论文ID
            abstract_link = paper.css("a[title='Abstract']::attr(href)").get()
            if not abstract_link:
                continue
                
            arxiv_id = abstract_link.split("/")[-1]
            
            # 获取对应的论文描述部分 (dd元素)
            paper_dd = paper.xpath("following-sibling::dd[1]")
            if not paper_dd:
                continue
            
            # 提取论文分类信息 - 在subjects部分
            subjects_text = paper_dd.css(".list-subjects .primary-subject::text").get()
            if not subjects_text:
                # 如果找不到主分类，尝试其他方式获取分类
                subjects_text = paper_dd.css(".list-subjects::text").get()
            
            if subjects_text:
                # 解析分类信息，通常格式如 "Computer Vision and Pattern Recognition (cs.CV)"
                # 提取括号中的分类代码
                categories_in_paper = re.findall(r'\(([^)]+)\)', subjects_text)
                
                # 检查论文分类是否与目标分类有交集
                paper_categories = set(categories_in_paper)
                if self.matches_target_categories(paper_categories):
                    yield {
                        "id": arxiv_id,
                        "categories": list(paper_categories),  # 添加分类信息用于调试
                    }
                    self.logger.info(f"Found paper {arxiv_id} with categories {paper_categories}")
                else:
                    self.logger.debug(f"Skipped paper {arxiv_id} with categories {paper_categories} (not in target {self.target_categories})")
            else:
                # 如果无法获取分类信息，记录警告但仍然返回论文（保持向后兼容）
                self.logger.warning(f"Could not extract categories for paper {arxiv_id}, including anyway")
                yield {
                    "id": arxiv_id,
                    "categories": [],
                }
