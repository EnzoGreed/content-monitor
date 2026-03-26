from django.db import models


class Keyword(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ContentItem(models.Model):
    SOURCE_CHOICES = [
        ('newsapi', 'NewsAPI'),
        ('rss', 'RSS'),
        ('mock', 'Mock'),
    ]

    title = models.CharField(max_length=300)
    body = models.TextField()
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES)
    last_updated = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Flag(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('relevant', 'Relevant'),
        ('irrelevant', 'Irrelevant'),
    ]

    keyword = models.ForeignKey(
        Keyword,
        on_delete=models.CASCADE,
        related_name='flags'
    )
    content_item = models.ForeignKey(
        ContentItem,
        on_delete=models.CASCADE,
        related_name='flags'
    )
    score = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    suppressed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('keyword', 'content_item')

    def __str__(self):
        return f"{self.keyword.name} → {self.content_item.title} ({self.status})"
